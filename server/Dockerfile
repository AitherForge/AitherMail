FROM golang:1.24-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN go build -trimpath -ldflags='-s -w' -o /aither-mail .

FROM alpine:3.22
WORKDIR /app
COPY --from=build /aither-mail /app/aither-mail
COPY ui /app/ui
EXPOSE 8025 1025
ENV AITHER_MAIL_HTTP=0.0.0.0:8025 AITHER_MAIL_SMTP=0.0.0.0:1025
CMD ["/app/aither-mail"]
