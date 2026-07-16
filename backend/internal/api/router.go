package api

import (
	"net/http"

	db "mindmap-backend/internal/db"
)

type Server struct {
	queries *db.Queries
}

func NewRouter(queries *db.Queries) http.Handler {
	s := &Server{queries: queries}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/nodes", s.listNodes)
	mux.HandleFunc("POST /api/nodes", s.createNode)
	mux.HandleFunc("GET /api/nodes/{id}", s.getNode)
	mux.HandleFunc("PUT /api/nodes/{id}", s.updateNode)
	mux.HandleFunc("DELETE /api/nodes/{id}", s.deleteNode)

	mux.HandleFunc("GET /api/edges", s.listEdges)
	mux.HandleFunc("POST /api/edges", s.createEdge)
	mux.HandleFunc("GET /api/edges/{id}", s.getEdge)
	mux.HandleFunc("PUT /api/edges/{id}", s.updateEdge)
	mux.HandleFunc("DELETE /api/edges/{id}", s.deleteEdge)

	mux.HandleFunc("GET /api/healthz", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	return mux
}
