FROM golang:1.26.6-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/aspio-api ./cmd/api && mkdir -p /out/uploads

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/aspio-api /aspio-api
COPY --chown=65532:65532 --from=build /out/uploads /data/uploads
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/aspio-api"]
