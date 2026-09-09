FROM golang:1.24-alpine AS build
WORKDIR /src
COPY server.go .
RUN go mod init aithermail && go mod tidy && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /aithermail server.go

FROM mailhog/mailhog:latest
COPY --from=build /aithermail /aithermail
COPY . /app

# Render should route public HTTP traffic to AitherMail's Go server.
# MailHog stays internal on 127.0.0.1:8025/1025.
EXPOSE 8080

CMD ["/bin/sh","-c","MailHog -api-bind-addr 127.0.0.1:8025 -ui-bind-addr 127.0.0.1:8025 -smtp-bind-addr 127.0.0.1:1025 & exec /aithermail"]
