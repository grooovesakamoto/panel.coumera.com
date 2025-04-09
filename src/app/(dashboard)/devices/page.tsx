"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useClientStore } from '@/store/use-client-store'
import { useDeviceStore } from '@/store/use-device-store'
import { DeviceList } from '@/components/devices/device-list'

export default function DevicesPage() {
  const router = useRouter()
  const { clients, fetchClients } = useClientStore()
  const { devices, fetchDevices } = useDeviceStore()

  useEffect(() => {
    fetchClients()
    clients.forEach((client) => {
      fetchDevices(client.id)
    })
  }, [fetchClients, fetchDevices, clients])

  return (
    <div className="container mx-auto py-6">
      <DeviceList />
    </div>
  )
} 