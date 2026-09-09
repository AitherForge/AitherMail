package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"strings"
)

const backend = "https://aitherbackend.onrender.com"
const mailhog = "http://127.0.0.1:8025"
const resendAPI = "https://api.resend.com/emails"

func auth(r *http.Request) (string, bool) {
	req, _ := http.NewRequest("GET", backend+"/api/auth/session", nil)
	if v := r.Header.Get("Authorization"); v != "" { req.Header.Set("Authorization", v) }
	if v := r.Header.Get("Cookie"); v != "" { req.Header.Set("Cookie", v) }
	resp, e := http.DefaultClient.Do(req)
	if e != nil || resp.StatusCode < 200 || resp.StatusCode >= 300 { return "", false }
	defer resp.Body.Close()
	var d struct { Authenticated bool `json:"authenticated"`; User struct { Email string `json:"email"` } `json:"user"` }
	if json.NewDecoder(resp.Body).Decode(&d) != nil { return "", false }
	return d.User.Email, d.Authenticated || d.User.Email != ""
}

func main() {
	port := os.Getenv("PORT")
	if port == "" { port = "10000" }
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", health)
	mux.HandleFunc("/api/config", config)
	mux.HandleFunc("/api/v1/send", send)
	mux.HandleFunc("/api/v2/messages", messages)
	mux.HandleFunc("/api/v1/messages/", message)
	mux.HandleFunc("/", static)
	log.Printf("AitherMail listening on 0.0.0.0:%s", port)
	log.Fatal(http.ListenAndServe("0.0.0.0:"+port, cors(mux)))
}

func health(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"ok":true,"service":"AitherMail"}`))
}

func config(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	provider := "mailhog"
	if os.Getenv("RESEND_API_KEY") != "" { provider = "resend" }
	json.NewEncoder(w).Encode(map[string]interface{}{
		"service": "AitherMail", "send_provider": provider,
		"resend_configured": os.Getenv("RESEND_API_KEY") != "",
		"resend_from_configured": os.Getenv("RESEND_FROM") != "",
	})
}

func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if origin == "https://aitherforge.github.io" || strings.HasSuffix(origin, ".github.io") || origin == "http://localhost:3000" || origin == "http://127.0.0.1:3000" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Credentials", "true")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
			w.Header().Add("Vary", "Origin")
		}
		if r.Method == http.MethodOptions { w.WriteHeader(http.StatusNoContent); return }
		next.ServeHTTP(w, r)
	})
}

func proxy(w http.ResponseWriter, r *http.Request, method, path string) {
	email, ok := auth(r)
	if !ok { http.Error(w, "unauthorized", http.StatusUnauthorized); return }
	req := must(method, mailhog+path, r)
	resp, e := http.DefaultClient.Do(req)
	if e != nil { http.Error(w, e.Error(), http.StatusBadGateway); return }
	defer resp.Body.Close()
	b, _ := io.ReadAll(resp.Body)
	if path == "/api/v2/messages" { b = filter(b, email) }
	if ct := resp.Header.Get("Content-Type"); ct != "" { w.Header().Set("Content-Type", ct) } else { w.Header().Set("Content-Type", "application/json") }
	w.WriteHeader(resp.StatusCode)
	w.Write(b)
}

func must(m, u string, r *http.Request) *http.Request {
	x, _ := http.NewRequest(m, u, r.Body)
	if v := r.Header.Get("Authorization"); v != "" { x.Header.Set("Authorization", v) }
	return x
}

func filter(b []byte, email string) []byte {
	var d struct { Total int `json:"total"`; Count int `json:"count"`; Start int `json:"start"`; Items []json.RawMessage `json:"items"` }
	if json.Unmarshal(b, &d) != nil { return b }
	out := d.Items[:0]
	for _, raw := range d.Items {
		var m struct { Content struct { Headers map[string][]string `json:"Headers"` } `json:"Content"` }
		if json.Unmarshal(raw, &m) != nil { continue }
		ok := false
		for _, k := range []string{"From", "To", "Cc", "Bcc"} {
			for _, v := range m.Content.Headers[k] { if strings.Contains(strings.ToLower(v), strings.ToLower(email)) { ok = true } }
		}
		if ok { out = append(out, raw) }
	}
	d.Items = out; d.Count = len(out); d.Total = len(out)
	x, _ := json.Marshal(d); return x
}

func messages(w http.ResponseWriter, r *http.Request) { proxy(w, r, "GET", r.URL.RequestURI()) }

func message(w http.ResponseWriter, r *http.Request) {
	email, ok := auth(r)
	if !ok { http.Error(w, "unauthorized", http.StatusUnauthorized); return }
	id := strings.TrimPrefix(r.URL.Path, "/api/v1/messages/")
	if id == "" { http.Error(w, "message id required", http.StatusBadRequest); return }
	if r.Method == "DELETE" {
		req, _ := http.NewRequest("GET", mailhog+"/api/v1/messages/"+id, nil)
		resp, e := http.DefaultClient.Do(req)
		if e != nil || resp.StatusCode != http.StatusOK { http.Error(w, "message not found", http.StatusNotFound); return }
		defer resp.Body.Close(); b, _ := io.ReadAll(resp.Body)
		if !bytes.Contains(bytes.ToLower(b), []byte(strings.ToLower(email))) { http.Error(w, "forbidden", http.StatusForbidden); return }
	}
	proxy(w, r, r.Method, "/api/v1/messages/"+id)
}

func send(w http.ResponseWriter, r *http.Request) {
	email, ok := auth(r)
	if !ok { http.Error(w, "unauthorized", http.StatusUnauthorized); return }
	var d struct { From, To, Cc, Bcc, Subject, Body, HTML string }
	if json.NewDecoder(r.Body).Decode(&d) != nil { http.Error(w, "invalid json", http.StatusBadRequest); return }
	if d.To == "" { http.Error(w, "recipient required", http.StatusBadRequest); return }
	if d.Subject == "" { d.Subject = "(no subject)" }

	// Resend is the production delivery provider. RESEND_FROM must be a verified
	// sender/domain in Resend. The authenticated Aither user is used as Reply-To.
	if key := os.Getenv("RESEND_API_KEY"); key != "" {
		from := os.Getenv("RESEND_FROM")
		if from == "" { from = email }
		payload := map[string]interface{}{
			"from": from, "to": splitAddresses(d.To), "subject": d.Subject,
			"text": d.Body,
			"reply_to": []string{email},
		}
		if d.HTML != "" { payload["html"] = d.HTML }
		if d.Cc != "" { payload["cc"] = splitAddresses(d.Cc) }
		if d.Bcc != "" { payload["bcc"] = splitAddresses(d.Bcc) }
		body, _ := json.Marshal(payload)
		req, _ := http.NewRequest("POST", resendAPI, bytes.NewReader(body))
		req.Header.Set("Authorization", "Bearer "+key)
		req.Header.Set("Content-Type", "application/json")
		resp, e := http.DefaultClient.Do(req)
		if e != nil { http.Error(w, "Resend unavailable: "+e.Error(), http.StatusBadGateway); return }
		defer resp.Body.Close()
		result, _ := io.ReadAll(resp.Body)
		if resp.StatusCode < 200 || resp.StatusCode >= 300 { http.Error(w, "Resend rejected the message: "+string(result), resp.StatusCode); return }

		// Keep a local sent copy so AitherMail can provide a Gmail-style Sent folder.
		_ = saveSentCopy(email, d)
		w.Header().Set("Content-Type", "application/json")
		w.Write(result)
		return
	}

	// Local/dev fallback: MailHog still works when Resend isn't configured.
	to := append(splitAddresses(d.To), splitAddresses(d.Cc)...)
	to = append(to, splitAddresses(d.Bcc)...)
	headers := fmt.Sprintf("From: %s\r\nTo: %s\r\n", email, d.To)
	if d.Cc != "" { headers += "Cc: " + d.Cc + "\r\n" }
	if d.Bcc != "" { headers += "Bcc: " + d.Bcc + "\r\n" }
	headers += fmt.Sprintf("Subject: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n%s\r\n", d.Subject, d.Body)
	if e := smtp.SendMail("127.0.0.1:1025", nil, email, to, []byte(headers)); e != nil { http.Error(w, e.Error(), http.StatusBadGateway); return }
	w.Header().Set("Content-Type", "application/json"); w.Write([]byte(`{"ok":true,"provider":"mailhog"}`))
}

func splitAddresses(v string) []string {
	var out []string
	for _, x := range strings.Split(v, ",") { if s := strings.TrimSpace(x); s != "" { out = append(out, s) } }
	return out
}

func saveSentCopy(from string, d struct { From, To, Cc, Bcc, Subject, Body, HTML string }) error {
	to := append(splitAddresses(d.To), splitAddresses(d.Cc)...)
	to = append(to, splitAddresses(d.Bcc)...)
	if len(to) == 0 { return nil }
	contentType := "text/plain; charset=utf-8"
	body := d.Body
	if d.HTML != "" { contentType = "text/html; charset=utf-8"; body = d.HTML }
	headers := fmt.Sprintf("From: %s\r\nTo: %s\r\nSubject: %s\r\nMIME-Version: 1.0\r\nContent-Type: %s\r\n\r\n%s\r\n", from, d.To, d.Subject, contentType, body)
	return smtp.SendMail("127.0.0.1:1025", nil, from, to, []byte(headers))
}

func static(w http.ResponseWriter, r *http.Request) {
	p := r.URL.Path; if p == "/" { p = "/index.html" }
	http.ServeFile(w, r, "/app/"+strings.TrimPrefix(p, "/"))
}
