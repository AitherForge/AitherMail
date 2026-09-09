package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"mime"
	"net/http"
	"net/mail"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/emersion/go-smtp"
)

type Message struct {
	ID string `json:"id"`
	From string `json:"from"`
	To []string `json:"to"`
	Created time.Time `json:"created"`
	Subject string `json:"subject"`
	Body string `json:"body"`
	Raw string `json:"raw"`
	Headers mail.Header `json:"headers"`
}

type store struct { sync.RWMutex; messages []*Message; seq uint64 }

func (s *store) add(from string, to []string, raw []byte) *Message {
	s.Lock(); defer s.Unlock(); s.seq++
	m := &Message{ID:fmt.Sprintf("aither-%d",s.seq),From:from,To:append([]string(nil),to...),Created:time.Now().UTC(),Raw:string(raw),Headers:mail.Header{}}
	if parsed,err:=mail.ReadMessage(strings.NewReader(string(raw))); err==nil {
		m.Headers=parsed.Header; body,_:=io.ReadAll(parsed.Body); m.Body=string(body); m.Subject=decodeHeader(parsed.Header.Get("Subject"))
	} else { m.Body=string(raw); m.Subject="(no subject)" }
	s.messages=append([]*Message{m},s.messages...); return m
}
func (s *store) list() []*Message { s.RLock(); defer s.RUnlock(); out:=make([]*Message,len(s.messages)); copy(out,s.messages); return out }
func (s *store) get(id string) *Message { s.RLock(); defer s.RUnlock(); for _,m:=range s.messages {if m.ID==id{return m}}; return nil }
func (s *store) delete(id string) bool { s.Lock(); defer s.Unlock(); for i,m:=range s.messages {if m.ID==id{s.messages=append(s.messages[:i],s.messages[i+1:]...);return true}};return false }
func (s *store) clear(){s.Lock();s.messages=nil;s.Unlock()}
func decodeHeader(v string) string {if v==""{return "(no subject)"};if d,e:=new(mime.WordDecoder).DecodeHeader(v);e==nil{return d};return v}

type backend struct{store *store}
func (b *backend) NewSession(_ *smtp.Conn)(smtp.Session,error){return &session{store:b.store},nil}
type session struct{store *store;from string;to []string}
func(s *session)Mail(from string,_ *smtp.MailOptions)error{s.from=from;s.to=nil;return nil}
func(s *session)Rcpt(to string,_ *smtp.RcptOptions)error{s.to=append(s.to,to);return nil}
func(s *session)Data(r io.Reader)error{raw,e:=io.ReadAll(r);if e!=nil{return e};s.store.add(s.from,s.to,raw);return nil}
func(s *session)Reset(){s.from="";s.to=nil}
func(s *session)Logout()error{return nil}

func writeJSON(w http.ResponseWriter,v any){w.Header().Set("Content-Type","application/json");_ = json.NewEncoder(w).Encode(v)}
func api(b *backend,w http.ResponseWriter,r *http.Request){
	w.Header().Set("Access-Control-Allow-Origin","*");w.Header().Set("Access-Control-Allow-Headers","Content-Type")
	if r.Method=="OPTIONS"{w.WriteHeader(http.StatusNoContent);return}
	path:=strings.TrimPrefix(r.URL.Path,"/api/")
	if path=="v2/messages"&&r.Method=="GET"{items:=b.store.list();writeJSON(w,map[string]any{"total":len(items),"count":len(items),"items":items});return}
	if strings.HasPrefix(path,"v1/messages/"){id:=strings.TrimPrefix(path,"v1/messages/");if r.Method=="GET"{m:=b.store.get(id);if m==nil{http.NotFound(w,r);return};writeJSON(w,m);return};if r.Method=="DELETE"{if !b.store.delete(id){http.NotFound(w,r);return};w.WriteHeader(http.StatusNoContent);return}}
	if (path=="v1/messages"||path=="v2/messages")&&r.Method=="DELETE"{b.store.clear();w.WriteHeader(http.StatusNoContent);return}
	if path=="events"&&r.Method=="GET"{w.Header().Set("Content-Type","text/event-stream");w.Header().Set("Cache-Control","no-cache");f,_:=w.(http.Flusher);for{select{case<-r.Context().Done():return;case<-time.After(3*time.Second):fmt.Fprint(w,"event: ping\ndata: {}\n\n");f.Flush()}}}
	http.NotFound(w,r)
}

func main(){
	smtpAddr:=flag.String("smtp",env("AITHER_MAIL_SMTP","0.0.0.0:1025"),"SMTP listen address")
	httpAddr:=flag.String("http",env("AITHER_MAIL_HTTP","0.0.0.0:8025"),"HTTP listen address")
	flag.Parse();st:=&store{};be:=&backend{store:st}
	server:=smtp.NewServer(be);server.Domain="aithermail.local";server.AllowInsecureAuth=true;server.Addr=*smtpAddr;server.MaxMessageBytes=25*1024*1024;server.MaxRecipients=100
	h:=http.NewServeMux();h.HandleFunc("/api/",func(w http.ResponseWriter,r *http.Request){api(be,w,r)});h.HandleFunc("/health",func(w http.ResponseWriter,r *http.Request){w.WriteHeader(http.StatusOK);fmt.Fprint(w,"ok")});h.Handle("/",http.FileServer(http.Dir("./ui")))
	go func(){log.Printf("Aither Mail SMTP listening on %s",*smtpAddr);if err:=server.ListenAndServe();err!=nil{log.Fatal(err)}}()
	log.Printf("Aither Mail web UI listening on %s",*httpAddr);if err:=http.ListenAndServe(*httpAddr,h);err!=nil{log.Fatal(err)}
}
func env(k,d string)string{if v:=os.Getenv(k);v!=""{return v};return d}
