package main

import (
	"log"
	"net/http"

	"calculator/handlers"
	"calculator/middleware"
)

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/add", handlers.Add)
	mux.HandleFunc("/subtract", handlers.Subtract)
	mux.HandleFunc("/multiply", handlers.Multiply)
	mux.HandleFunc("/divide", handlers.Divide)

	handler := middleware.CORS(mux)

	log.Println("Calculator API starting on :8080")
	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatal(err)
	}
}
