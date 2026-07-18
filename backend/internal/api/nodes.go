package api

import (
	"errors"
	"net/http"

	"github.com/jackc/pgx/v5"

	db "mindmap-backend/internal/db"
)

type nodeRequest struct {
	ID               string  `json:"id"`
	Type             string  `json:"type"`
	Subtype          *string `json:"subtype"`
	Label            string  `json:"label"`
	Description      *string `json:"description"`
	PrimaryAttribute *string `json:"primaryAttribute"`
}

func (s *Server) listNodes(w http.ResponseWriter, r *http.Request) {
	nodes, err := s.queries.ListNodes(r.Context())
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	if nodes == nil {
		nodes = []db.MindmapNode{}
	}
	writeJSON(w, http.StatusOK, nodes)
}

func (s *Server) getNode(w http.ResponseWriter, r *http.Request) {
	node, err := s.queries.GetNode(r.Context(), r.PathValue("id"))
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "node not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, node)
}

func (s *Server) createNode(w http.ResponseWriter, r *http.Request) {
	var req nodeRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if req.ID == "" || req.Type == "" || req.Label == "" {
		writeError(w, http.StatusBadRequest, "id, type, and label are required")
		return
	}

	node, err := s.queries.CreateNode(r.Context(), db.CreateNodeParams{
		ID:               req.ID,
		Type:             req.Type,
		Subtype:          req.Subtype,
		Label:            req.Label,
		Description:      req.Description,
		PrimaryAttribute: req.PrimaryAttribute,
	})
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusCreated, node)
}

func (s *Server) updateNode(w http.ResponseWriter, r *http.Request) {
	var req nodeRequest
	if err := decodeJSON(r, &req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	if req.Type == "" || req.Label == "" {
		writeError(w, http.StatusBadRequest, "type and label are required")
		return
	}

	node, err := s.queries.UpdateNode(r.Context(), db.UpdateNodeParams{
		ID:               r.PathValue("id"),
		Type:             req.Type,
		Subtype:          req.Subtype,
		Label:            req.Label,
		Description:      req.Description,
		PrimaryAttribute: req.PrimaryAttribute,
	})
	if errors.Is(err, pgx.ErrNoRows) {
		writeError(w, http.StatusNotFound, "node not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	writeJSON(w, http.StatusOK, node)
}

func (s *Server) deleteNode(w http.ResponseWriter, r *http.Request) {
	if err := s.queries.DeleteNode(r.Context(), r.PathValue("id")); err != nil {
		writeError(w, http.StatusInternalServerError, err.Error())
		return
	}
	writeJSON(w, http.StatusNoContent, nil)
}
