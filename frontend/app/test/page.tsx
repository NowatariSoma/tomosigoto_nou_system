import UserList from '@/components/UserList'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Test Page</h1>
          <p className="text-gray-600 mt-2">Supabase User Data Integration Test</p>
        </div>
        
        <UserList />
      </div>
    </div>
  )
} 