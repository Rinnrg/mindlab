import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function StudentProfileLoading() {
  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Profile Header Skeleton */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
            <Skeleton className="h-20 w-20 rounded-full sm:h-24 sm:w-24" />
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <Skeleton className="mx-auto h-7 w-48 sm:mx-0 sm:h-8" />
              <Skeleton className="mx-auto h-4 w-64 sm:mx-0" />
              <Skeleton className="mx-auto h-4 w-56 sm:mx-0" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
              <Skeleton className="h-10 w-10 rounded-lg sm:h-12 sm:w-12" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-16 sm:h-4 sm:w-20" />
                <Skeleton className="h-5 w-10 sm:h-6 sm:w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <Skeleton className="h-10 w-48 sm:w-64" />

      {/* Grid Skeleton */}
      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-video" />
            <CardContent className="p-3 sm:p-4 space-y-2">
              <Skeleton className="h-4 w-16 sm:h-5" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
