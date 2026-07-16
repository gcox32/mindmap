package api

import (
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"

	db "mindmap-backend/internal/db"
)

type edgeRequest struct {
	ID     string `json:"id"`
	Source string `json:"source"`
	Target string `json:"target"`
	Kind   string `json:"kind"`
	Volume int32  `json:"volume"`
}

func (s *Server) listEdges(w http.ResponseWriter, r *http.Request) {
	edges, err := s.queries.ListEdges(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if edges == nil {
		edges = []db.MindmapEdge{}
	}
	writeJSON(w, http.StatusOK, edges)
}

func (s *Server) getEdge(w http.ResponseWriter, r *http.Request) {
	edge, err := s.queries.GetEdge(r.Context(), r.PathValue("id"))
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "edge not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, edge)
}

func (s *Server) createEdge(w http.ResponseWriter, r *http.Request) {
	var req edgeRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if req.ID == "" || req.Source == "" || req.Target == "" || req.Kind == "" {
		writeError(w, http.StatusBadRequest, "id, source, target, and kind are required")
		return
	}

	edge, err := s.queries.CreateEdge(r.Context(), db.CreateEdgeParams{
		ID:     req.ID,
		Source: req.Source,
		Target: req.Target,
		Kind:   req.Kind,
		Volume: req.Volume,
	})
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, edge)
}

func (s *Server) updateEdge(w http.ResponseWriter, r *http.Request) {
	var req edgeRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if req.Source == "" || req.Target == "" || req.Kind == "" {
		writeError(w, http.StatusBadRequest, "source, target, and kind are required")
		return
	}

	edge, err := s.queries.UpdateEdge(r.Context(), db.UpdateEdgeParams{
		ID:     r.PathValue("id"),
		Source: req.Source,
		Target: req.Target,
		Kind:   req.Kind,
		Volume: req.Volume,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "edge not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, edge)
}

func (s *Server) deleteEdge(w http.ResponseWriter, r *http.Request) {
	if err := s.queries.DeleteEdge(r.Context(), r.PathValue("id")); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusNoContent, nil)
}
