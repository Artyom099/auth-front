import { Globe, Shield, Smartphone } from 'lucide-react';

export const mockUserData = {
  name: "Александр Петров",
  email: "alex@example.com",
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
  devices: [
    { id: 1, name: "iPhone 13", type: "Mobile", lastActive: "2024-03-15 14:30", location: "Москва" },
    { id: 2, name: "MacBook Pro", type: "Desktop", lastActive: "2024-03-15 15:45", location: "Москва" },
    { id: 3, name: "iPad Air", type: "Tablet", lastActive: "2024-03-14 18:20", location: "Санкт-Петербург" }
  ],
  services: [
    { id: 1, name: "Cloud Storage", status: "Active", icon: Globe },
    { id: 2, name: "Security Suite", status: "Active", icon: Shield },
    { id: 3, name: "Mobile App", status: "Inactive", icon: Smartphone }
  ]
};