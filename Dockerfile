FROM golang:1.24-alpine AS build
WORKDIR /src
COPY server.go .
RUN go mod init aithermail && go mod tidy && CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /aithermail server.go

FROM mailhog/mailhog:latest
COPY --from=build /aithermail /aithermail
COPY . /app
RUN chmod +x /app/start.sh
EXPOSE 8080 1025 8025
CMD ["/app/start.sh"]
