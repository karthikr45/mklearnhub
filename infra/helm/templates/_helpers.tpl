{{/*
Expand the name of the chart.
*/}}
{{- define "learnhub.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "learnhub.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Chart name and version label.
*/}}
{{- define "learnhub.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "learnhub.labels" -}}
helm.sh/chart: {{ include "learnhub.chart" . }}
{{ include "learnhub.selectorLabels" . }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "learnhub.selectorLabels" -}}
app.kubernetes.io/name: {{ include "learnhub.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Per-component labels. Pass a dict: (dict "root" . "component" "api")
*/}}
{{- define "learnhub.componentLabels" -}}
{{ include "learnhub.selectorLabels" .root }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{/*
Names of the generated ConfigMap and Secret.
*/}}
{{- define "learnhub.configMapName" -}}
{{ include "learnhub.fullname" . }}-config
{{- end }}

{{- define "learnhub.secretName" -}}
{{ include "learnhub.fullname" . }}-secret
{{- end }}
