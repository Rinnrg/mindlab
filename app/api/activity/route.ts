import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 60

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')
    const limit = parseInt(searchParams.get('limit') || '20')

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'userId dan role diperlukan' },
        { status: 400 }
      )
    }

    const activities: any[] = []

    if (role === 'SISWA') {
      const [recentNilai, recentProjects, recentEnrollments, recentMateri, recentSubmissions] = await Promise.all([
        // Nilai/Grades
        prisma.nilai.findMany({
          where: { siswaId: userId },
          select: {
            id: true,
            tanggal: true,
            skor: true,
            asesmen: {
              select: {
                nama: true,
                tipe: true,
                course: {
                  select: {
                    judul: true
                  }
                }
              }
            }
          },
          orderBy: { tanggal: 'desc' },
          take: 10
        }),
        // Project submissions via kelompok
        prisma.pengumpulanProyek.findMany({
          where: {
            kelompok: {
              anggota: {
                some: {
                  siswaId: userId
                }
              }
            }
          },
          select: {
            id: true,
            tgl_unggah: true,
            nilai: true,
            kelompok: {
              select: {
                nama: true,
                proyek: {
                  select: {
                    judul: true
                  }
                }
              }
            }
          },
          orderBy: { tgl_unggah: 'desc' },
          take: 5
        }),
        // Enrollments
        prisma.enrollment.findMany({
          where: { siswaId: userId },
          select: {
            id: true,
            enrolledAt: true,
            progress: true,
            course: {
              select: {
                judul: true
              }
            }
          },
          orderBy: { enrolledAt: 'desc' },
          take: 5
        }),
        // Materi from enrolled courses (new materi)
        prisma.materi.findMany({
          where: {
            course: {
              enrollments: {
                some: {
                  siswaId: userId
                }
              }
            }
          },
          select: {
            id: true,
            judul: true,
            tgl_unggah: true,
            course: {
              select: {
                judul: true
              }
            }
          },
          orderBy: { tgl_unggah: 'desc' },
          take: 5
        }),
        // Direct submissions (tugas individu)
        prisma.pengumpulanProyek.findMany({
          where: {
            siswaId: userId,
            asesmenId: { not: null }
          },
          select: {
            id: true,
            tgl_unggah: true,
            nilai: true,
            asesmen: {
              select: {
                nama: true,
                course: {
                  select: {
                    judul: true
                  }
                }
              }
            }
          },
          orderBy: { tgl_unggah: 'desc' },
          take: 5
        }),
      ])

      recentNilai.forEach(n => {
        activities.push({
          id: `nilai-${n.id}`,
          action: 'completed',
          item: n.asesmen.nama,
          course: n.asesmen.course.judul,
          time: n.tanggal.toISOString(),
          type: n.asesmen.tipe === 'KUIS' ? 'quiz' : 'assignment',
          score: n.skor
        })
      })

      recentProjects.forEach(p => {
        if (p.kelompok) {
          activities.push({
            id: `project-sub-${p.id}`,
            action: 'submitted',
            item: p.kelompok.proyek.judul,
            group: p.kelompok.nama,
            time: p.tgl_unggah.toISOString(),
            type: 'submission',
            score: p.nilai
          })
        }
      })

      recentEnrollments.forEach(e => {
        activities.push({
          id: `enroll-${e.id}`,
          action: 'enrolled',
          item: e.course.judul,
          time: e.enrolledAt.toISOString(),
          type: 'enrollment',
          progress: e.progress
        })
      })

      recentMateri.forEach(m => {
        activities.push({
          id: `materi-new-${m.id}`,
          action: 'new_materi',
          item: m.judul,
          course: m.course.judul,
          time: m.tgl_unggah.toISOString(),
          type: 'materi'
        })
      })

      recentSubmissions.forEach(s => {
        if (s.asesmen) {
          activities.push({
            id: `submission-${s.id}`,
            action: 'submitted',
            item: s.asesmen.nama,
            course: s.asesmen.course.judul,
            time: s.tgl_unggah.toISOString(),
            type: 'submission',
            score: s.nilai
          })
        }
      })
    } else if (role === 'GURU') {
      const [recentCourses, recentAsesmen, recentProjects, recentGrades, recentMateri, recentEnrollments] = await Promise.all([
        // Courses created by teacher
        prisma.course.findMany({
          where: { guruId: userId },
          select: {
            id: true,
            judul: true,
            kategori: true,
            _count: {
              select: {
                enrollments: true
              }
            }
          },
          orderBy: { id: 'desc' },
          take: 5
        }),
        // Asesmen created by teacher
        prisma.asesmen.findMany({
          where: { guruId: userId },
          select: {
            id: true,
            nama: true,
            tipe: true,
            tgl_mulai: true,
            course: {
              select: {
                judul: true
              }
            }
          },
          orderBy: { id: 'desc' },
          take: 5
        }),
        // Projects created by teacher
        prisma.proyek.findMany({
          where: { guruId: userId },
          select: {
            id: true,
            judul: true,
            tgl_mulai: true,
          },
          orderBy: { tgl_mulai: 'desc' },
          take: 5
        }),
        // Graded submissions
        prisma.pengumpulanProyek.findMany({
          where: {
            OR: [
              {
                kelompok: {
                  proyek: {
                    guruId: userId
                  }
                },
                nilai: { not: null }
              },
              {
                asesmen: {
                  guruId: userId
                },
                nilai: { not: null }
              }
            ]
          },
          select: {
            id: true,
            tgl_unggah: true,
            nilai: true,
            kelompok: {
              select: {
                nama: true,
                proyek: {
                  select: {
                    judul: true
                  }
                },
              }
            },
            asesmen: {
              select: {
                nama: true,
                course: {
                  select: {
                    judul: true
                  }
                }
              }
            }
          },
          orderBy: { tgl_unggah: 'desc' },
          take: 5
        }),
        // Materi created by teacher (via their courses)
        prisma.materi.findMany({
          where: {
            course: {
              guruId: userId
            }
          },
          select: {
            id: true,
            judul: true,
            tgl_unggah: true,
            course: {
              select: {
                judul: true
              }
            }
          },
          orderBy: { tgl_unggah: 'desc' },
          take: 5
        }),
        // New enrollments in teacher's courses
        prisma.enrollment.findMany({
          where: {
            course: {
              guruId: userId
            }
          },
          select: {
            id: true,
            enrolledAt: true,
            siswa: {
              select: {
                nama: true
              }
            },
            course: {
              select: {
                judul: true
              }
            }
          },
          orderBy: { enrolledAt: 'desc' },
          take: 5
        }),
      ])

      recentCourses.forEach(c => {
        activities.push({
          id: `course-${c.id}`,
          action: 'created',
          item: c.judul,
          time: new Date().toISOString(),
          type: 'course',
          detail: `${c._count.enrollments} siswa terdaftar`
        })
      })

      recentAsesmen.forEach(a => {
        activities.push({
          id: `asesmen-${a.id}`,
          action: 'created',
          item: a.nama,
          course: a.course.judul,
          time: a.tgl_mulai?.toISOString() || new Date().toISOString(),
          type: 'assessment'
        })
      })

      recentProjects.forEach(p => {
        activities.push({
          id: `project-${p.id}`,
          action: 'created',
          item: p.judul,
          time: p.tgl_mulai.toISOString(),
          type: 'project'
        })
      })

      recentGrades.forEach(g => {
        const itemName = g.kelompok?.proyek?.judul || g.asesmen?.nama || 'Item'
        const courseName = g.asesmen?.course?.judul || undefined
        activities.push({
          id: `grade-${g.id}`,
          action: 'graded',
          item: itemName,
          group: g.kelompok?.nama,
          course: courseName,
          time: g.tgl_unggah.toISOString(),
          type: 'grade',
          score: g.nilai
        })
      })

      recentMateri.forEach(m => {
        activities.push({
          id: `materi-${m.id}`,
          action: 'created',
          item: m.judul,
          course: m.course.judul,
          time: m.tgl_unggah.toISOString(),
          type: 'materi'
        })
      })

      recentEnrollments.forEach(e => {
        activities.push({
          id: `enroll-guru-${e.id}`,
          action: 'student_enrolled',
          item: e.siswa.nama,
          course: e.course.judul,
          time: e.enrolledAt.toISOString(),
          type: 'enrollment'
        })
      })
    } else if (role === 'ADMIN') {
      // ADMIN activities - overview of the whole system
      const [recentUsers, recentCourses, recentAsesmen, recentMateri, recentEnrollments] = await Promise.all([
        // Recently created users
        prisma.user.findMany({
          select: {
            id: true,
            nama: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }),
        // Recently created courses
        prisma.course.findMany({
          select: {
            id: true,
            judul: true,
            kategori: true,
            guru: {
              select: {
                nama: true
              }
            }
          },
          orderBy: { id: 'desc' },
          take: 5
        }),
        // Recently created asesmen
        prisma.asesmen.findMany({
          select: {
            id: true,
            nama: true,
            tipe: true,
            tgl_mulai: true,
            course: {
              select: {
                judul: true
              }
            },
            guru: {
              select: {
                nama: true
              }
            }
          },
          orderBy: { id: 'desc' },
          take: 5
        }),
        // Recently created materi
        prisma.materi.findMany({
          select: {
            id: true,
            judul: true,
            tgl_unggah: true,
            course: {
              select: {
                judul: true,
                guru: {
                  select: {
                    nama: true
                  }
                }
              }
            }
          },
          orderBy: { tgl_unggah: 'desc' },
          take: 5
        }),
        // Recent enrollments
        prisma.enrollment.findMany({
          select: {
            id: true,
            enrolledAt: true,
            siswa: {
              select: {
                nama: true
              }
            },
            course: {
              select: {
                judul: true
              }
            }
          },
          orderBy: { enrolledAt: 'desc' },
          take: 5
        }),
      ])

      recentUsers.forEach(u => {
        activities.push({
          id: `user-${u.id}`,
          action: 'user_created',
          item: u.nama,
          time: u.createdAt.toISOString(),
          type: 'user',
          detail: u.role
        })
      })

      recentCourses.forEach(c => {
        activities.push({
          id: `admin-course-${c.id}`,
          action: 'course_created',
          item: c.judul,
          course: `oleh ${c.guru.nama}`,
          time: new Date().toISOString(),
          type: 'course'
        })
      })

      recentAsesmen.forEach(a => {
        activities.push({
          id: `admin-asesmen-${a.id}`,
          action: 'assessment_created',
          item: a.nama,
          course: `${a.course.judul} • oleh ${a.guru.nama}`,
          time: a.tgl_mulai?.toISOString() || new Date().toISOString(),
          type: 'assessment'
        })
      })

      recentMateri.forEach(m => {
        activities.push({
          id: `admin-materi-${m.id}`,
          action: 'materi_created',
          item: m.judul,
          course: `${m.course.judul} • oleh ${m.course.guru.nama}`,
          time: m.tgl_unggah.toISOString(),
          type: 'materi'
        })
      })

      recentEnrollments.forEach(e => {
        activities.push({
          id: `admin-enroll-${e.id}`,
          action: 'student_enrolled',
          item: e.siswa.nama,
          course: e.course.judul,
          time: e.enrolledAt.toISOString(),
          type: 'enrollment'
        })
      })
    }

    // Sort by time descending
    activities.sort((a, b) => 
      new Date(b.time).getTime() - new Date(a.time).getTime()
    )

    // Limit results
    const limitedActivities = activities.slice(0, limit)

    const response = NextResponse.json({ activities: limitedActivities })
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
    return response
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil aktivitas' },
      { status: 500 }
    )
  }
}
