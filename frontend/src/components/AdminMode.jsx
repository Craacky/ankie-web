import { useEffect, useState } from 'react'

import { api } from '../api'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export function AdminMode({ notify }) {
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [requests, setRequests] = useState([])
  const [alerts, setAlerts] = useState([])

  async function refresh() {
    setLoading(true)
    try {
      const [ov, usersRes, reqRes, alertRes] = await Promise.all([
        api.getAdminOverview(60),
        api.getAdminUsers(1440, 100),
        api.getAdminRequests({ limit: 200 }),
        api.getAdminAlerts(100)
      ])
      setOverview(ov)
      setUsers(usersRes)
      setRequests(reqRes)
      setAlerts(alertRes)
    } catch (err) {
      notify(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  async function banUser(userId) {
    if (!window.confirm('Ban this user?')) return
    try {
      await api.adminBan({ user_id: userId, reason: 'manual ban' })
      await refresh()
      notify('User banned')
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  async function unbanUser(userId) {
    try {
      await api.adminUnban({ user_id: userId })
      await refresh()
      notify('User unbanned')
    } catch (err) {
      notify(err.message, 'error')
    }
  }

  useEffect(() => {
    refresh().catch(() => {})
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Admin Dashboard</h2>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Overview (last 60 min)</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {overview ? (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div>Total requests: {overview.total_requests}</div>
              <div>Unique users: {overview.unique_users}</div>
              <div>Unique IPs: {overview.unique_ips}</div>
              <div>Errors: {overview.error_requests}</div>
            </div>
          ) : (
            <p>No data yet</p>
          )}
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Users (last 24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-2 text-sm">
                <div>
                  <div className="font-medium">{user.username || user.first_name || `User ${user.id}`}</div>
                  <div className="text-xs text-muted-foreground">
                    req: {user.request_count} | errors: {user.error_count} | last: {user.last_seen || 'n/a'}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.is_banned ? (
                    <Button size="sm" variant="outline" onClick={() => unbanUser(user.id)}>
                      Unban
                    </Button>
                  ) : (
                    <Button size="sm" variant="destructive" onClick={() => banUser(user.id)}>
                      Ban
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {users.length === 0 && <p className="text-sm text-muted-foreground">No users yet</p>}
          </div>
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {alerts.length === 0 && <p>No alerts</p>}
          {alerts.map((alert) => (
            <div key={alert.id} className="border-b py-1">
              {alert.kind} | user: {alert.user_id || 'n/a'} | ip: {alert.ip || 'n/a'} | count: {alert.count}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="glass-panel">
        <CardHeader>
          <CardTitle>Recent Requests</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          {requests.slice(0, 100).map((req) => (
            <div key={req.id} className="border-b py-1">
              [{req.status_code}] {req.method} {req.path} user={req.user_id || 'n/a'} ip={req.ip || 'n/a'} ms={req.duration_ms}
            </div>
          ))}
          {requests.length === 0 && <p>No requests yet</p>}
        </CardContent>
      </Card>
    </div>
  )
}
