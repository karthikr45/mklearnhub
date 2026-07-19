'use client'

import { useQuery } from '@tanstack/react-query'
import { Award, Download } from 'lucide-react'

import { PageHeader } from '@/components/layout/PageHeader'
import { api } from '@/lib/api'

interface Certificate {
  id: string
  certificateNo: string
  issuedAt: string
  pdfUrl?: string | null
  course: { id: string; title: string }
}

export default function CertificatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['certificates'],
    queryFn: async () => {
      const { data } = await api.get<Certificate[]>('/courses/me/certificates')
      return data
    },
  })

  return (
    <div>
      <PageHeader
        title="Certificates"
        description="Certificates you have earned."
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data || data.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <Award className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium">No certificates yet</p>
          <p className="text-sm text-muted-foreground">
            Complete a course to earn your first certificate.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Course</th>
                <th className="px-4 py-3 font-medium">Certificate No.</th>
                <th className="px-4 py-3 font-medium">Issued</th>
                <th className="px-4 py-3 font-medium">Download</th>
              </tr>
            </thead>
            <tbody>
              {data.map((cert) => (
                <tr key={cert.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{cert.course.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {cert.certificateNo}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(cert.issuedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {cert.pdfUrl ? (
                      <a
                        href={cert.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <Download className="h-4 w-4" /> PDF
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
