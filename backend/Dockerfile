# ── Stage 1: build ─────────────────────────────────────────────
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Cache dependencies before copying source
COPY go.mod ./
RUN go mod download

COPY . .

# Produce a statically-linked binary
RUN CGO_ENABLED=0 GOOS=linux go build -o calculator-api .

# ── Stage 2: minimal runtime image ─────────────────────────────
FROM alpine:3.19

WORKDIR /app

COPY --from=builder /app/calculator-api .

EXPOSE 8080

CMD ["./calculator-api"]
