import { createFileRoute } from '@tanstack/react-router'
import { ScheduleViewer } from '@/components/ScheduleViewer'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return <ScheduleViewer />
}
