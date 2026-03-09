{{/*
Expand the name of the chart.
*/}}
{{- define "sentinela.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "sentinela.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- printf "%s" $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "sentinela.labels" -}}
helm.sh/chart: {{ include "sentinela.name" . }}-{{ .Chart.Version }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "sentinela.selectorLabels" -}}
app.kubernetes.io/name: {{ include "sentinela.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Common environment variables for all services
*/}}
{{- define "sentinela.commonEnv" -}}
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: sentinela-secrets
      key: database-url
- name: REDIS_URL
  value: "redis://{{ .Release.Name }}-redis-master:6379"
- name: KAFKA_BROKERS
  value: "{{ .Release.Name }}-kafka:9092"
- name: ELASTICSEARCH_URL
  value: "http://{{ .Release.Name }}-elasticsearch:9200"
- name: S3_ENDPOINT
  value: "http://{{ .Release.Name }}-minio:9000"
- name: S3_ACCESS_KEY
  valueFrom:
    secretKeyRef:
      name: sentinela-secrets
      key: minio-access-key
- name: S3_SECRET_KEY
  valueFrom:
    secretKeyRef:
      name: sentinela-secrets
      key: minio-secret-key
- name: S3_BUCKET
  value: sentinela
- name: NODE_ENV
  value: production
- name: NLP_SERVICE_URL
  value: "http://{{ .Release.Name }}-nlp-service:8000"
- name: INGESTION_SERVICE_URL
  value: "http://{{ .Release.Name }}-ingestion-service:3001"
- name: CORRELATION_SERVICE_URL
  value: "http://{{ .Release.Name }}-correlation-service:3002"
- name: ALERT_SERVICE_URL
  value: "http://{{ .Release.Name }}-alert-service:3003"
- name: REPORT_SERVICE_URL
  value: "http://{{ .Release.Name }}-report-service:3004"
{{- end }}
