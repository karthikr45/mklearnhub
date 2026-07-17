# ── Main application media bucket ───────────────────────────────────────────
resource "aws_s3_bucket" "media" {
  bucket = "${local.name}-media"
  tags   = { Name = "${local.name}-media" }
}

resource "aws_s3_bucket_versioning" "media" {
  bucket = aws_s3_bucket.media.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "media" {
  bucket = aws_s3_bucket.media.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket                  = aws_s3_bucket.media.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id
  cors_rule {
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["https://${var.domain}"]
    allowed_headers = ["*"]
    max_age_seconds = 3000
  }
}

# ── Per-org isolation (example) ─────────────────────────────────────────────
# Dedicated-instance customers get their own prefix (or bucket). To grant a
# per-org IAM role access to only its prefix, attach a policy like:
#
#   data "aws_iam_policy_document" "org_prefix" {
#     statement {
#       actions   = ["s3:GetObject", "s3:PutObject"]
#       resources = ["${aws_s3_bucket.media.arn}/orgs/${var.org_id}/*"]
#     }
#   }
#
# Cross-org access is denied by default because the bucket is fully private and
# access flows only through presigned URLs minted by the API for the caller's org.
