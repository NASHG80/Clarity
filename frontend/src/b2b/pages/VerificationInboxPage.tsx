import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Building2, MapPin, Edit2, ShieldCheck, 
  Mail, Globe, Phone, Users, CreditCard, Lock,
  CheckCircle2, Bell, FileText
} from 'lucide-react';
import { Button } from '../../shared/components/Button';
import { DataStateBadge } from '../../shared/components/DataStateBadge';

export default function BusinessProfilePage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');

  const businessInfo = {
    companyName: "Emerald Retreats Pvt. Ltd.",
    registrationNumber: "CIN-U55101KA2024PTC123456",
    taxId: "29ABCDE1234F1Z5",
    address: "Block A, Prestige Tech Park, Marathahalli, Bengaluru, 560103",
    website: "www.emeraldretreats.in",
    email: "admin@emeraldretreats.in",
    phone: "+91 98765 43210",
    status: "Verified Business",
    totalProperties: 12
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <Building2 className="w-4 h-4" /> },
    { id: 'team', label: 'Team', icon: <Users className="w-4 h-4" /> },
    { id: 'billing', label: 'Billing & Tax', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'security', label: 'Security', icon: <Lock className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] font-sans text-[#1C2B22] pb-24">
      {/* ── HEADER ── */}
      <div className="bg-white border-b border-[#26382D]/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-[#E8EFEA] border border-[#26382D]/10 flex items-center justify-center text-[#26382D] shadow-sm">
                <Building2 className="w-10 h-10" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl font-bold font-serif tracking-tight text-[#1C2B22]">
                    {businessInfo.companyName}
                  </h1>
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {businessInfo.status}
                  </span>
                </div>
                <p className="text-[#5B6D62] text-sm flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Bengaluru, India</span>
                  <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> {businessInfo.website}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <Globe className="w-4 h-4" /> View Public Page
              </Button>
              <Button className="flex items-center gap-2 bg-[#26382D] hover:bg-[#1A261E] text-white">
                <Edit2 className="w-4 h-4" /> Edit Profile
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 flex flex-col md:flex-row gap-8">
        
        {/* ── SIDEBAR NAV ── */}
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="flex flex-col gap-1 sticky top-32">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-[#26382D] text-white shadow-md' 
                    : 'text-[#5B6D62] hover:bg-[#E8EFEA] hover:text-[#26382D]'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* ── CONTENT AREA ── */}
        <div className="flex-1">
          {activeTab === 'general' && (
            <div className="space-y-6">
              
              <div className="bg-white rounded-2xl border border-[#26382D]/10 p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold font-serif mb-6 text-[#1C2B22]">Company Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6D62] mb-1">Legal Business Name</p>
                    <p className="text-[15px] font-medium text-[#1C2B22]">{businessInfo.companyName}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6D62] mb-1">Total Active Properties</p>
                    <p className="text-[15px] font-medium text-[#1C2B22]">{businessInfo.totalProperties} Listings</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6D62] mb-1">Corporate Registration (CIN)</p>
                    <p className="text-[15px] font-medium text-[#1C2B22]">{businessInfo.registrationNumber}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6D62] mb-1">GSTIN / Tax ID</p>
                    <p className="text-[15px] font-medium text-[#1C2B22]">{businessInfo.taxId}</p>
                  </div>

                  <div className="md:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6D62] mb-1">Registered Address</p>
                    <p className="text-[15px] font-medium text-[#1C2B22]">{businessInfo.address}</p>
                  </div>

                </div>
              </div>

              <div className="bg-white rounded-2xl border border-[#26382D]/10 p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold font-serif mb-6 text-[#1C2B22]">Primary Contact</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6D62] mb-1">Administrator Email</p>
                    <p className="text-[15px] font-medium text-[#1C2B22] flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#5B6D62]" /> {businessInfo.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#5B6D62] mb-1">Contact Phone</p>
                    <p className="text-[15px] font-medium text-[#1C2B22] flex items-center gap-2">
                      <Phone className="w-4 h-4 text-[#5B6D62]" /> {businessInfo.phone}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'team' && (
            <div className="bg-white rounded-2xl border border-[#26382D]/10 p-6 md:p-8 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold font-serif text-[#1C2B22]">Team Members</h2>
                <Button className="bg-[#26382D] hover:bg-[#1A261E] text-white text-sm py-1.5 px-4 h-auto">Add Member</Button>
              </div>
              <div className="border border-[#26382D]/10 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#F8F6F3] text-[#5B6D62] border-b border-[#26382D]/10">
                    <tr>
                      <th className="px-6 py-4 font-medium">User</th>
                      <th className="px-6 py-4 font-medium">Role</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#26382D]/5">
                    {[
                      { name: 'Aditya Sharma', email: 'aditya@emeraldretreats.in', role: 'Administrator', status: 'Active' },
                      { name: 'Priya Patel', email: 'priya@emeraldretreats.in', role: 'Property Manager', status: 'Active' },
                      { name: 'Rahul Desai', email: 'rahul@emeraldretreats.in', role: 'Finance', status: 'Pending' }
                    ].map((user, i) => (
                      <tr key={i} className="hover:bg-[#FDFBF7]">
                        <td className="px-6 py-4">
                          <div className="font-medium text-[#1C2B22]">{user.name}</div>
                          <div className="text-xs text-[#5B6D62]">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 text-[#1C2B22]">{user.role}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-[#5B6D62] hover:text-[#1C2B22] font-medium text-sm">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[#26382D]/10 p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold font-serif mb-6 text-[#1C2B22]">Current Plan</h2>
                <div className="flex items-center justify-between p-5 bg-[#F8F6F3] rounded-xl border border-[#26382D]/10">
                  <div>
                    <h3 className="font-bold text-[#1C2B22] text-lg">Pro Partner Plan</h3>
                    <p className="text-[#5B6D62] text-sm mt-1">₹15,000 / month • Next billing on Oct 1, 2026</p>
                  </div>
                  <Button variant="outline" className="border-[#26382D]/20">Manage Plan</Button>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-[#26382D]/10 p-6 md:p-8 shadow-sm">
                <h2 className="text-xl font-bold font-serif mb-6 text-[#1C2B22]">Payment Methods</h2>
                <div className="flex items-center justify-between p-5 border border-[#26382D]/10 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-8 bg-gray-100 rounded flex items-center justify-center border border-gray-200">
                      <span className="font-bold text-gray-700 text-xs tracking-wider">VISA</span>
                    </div>
                    <div>
                      <p className="font-medium text-[#1C2B22]">•••• •••• •••• 4242</p>
                      <p className="text-xs text-[#5B6D62]">Expires 12/28</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">Default</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl border border-[#26382D]/10 p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold font-serif mb-6 text-[#1C2B22]">Security Settings</h2>
              <div className="space-y-6 divide-y divide-[#26382D]/10">
                <div className="flex items-center justify-between pb-6">
                  <div>
                    <h3 className="font-medium text-[#1C2B22]">Password</h3>
                    <p className="text-sm text-[#5B6D62] mt-1">Last changed 3 months ago</p>
                  </div>
                  <Button variant="outline">Update Password</Button>
                </div>
                <div className="flex items-center justify-between pt-6">
                  <div>
                    <h3 className="font-medium text-[#1C2B22]">Two-Factor Authentication (2FA)</h3>
                    <p className="text-sm text-[#5B6D62] mt-1">Add an extra layer of security to your account.</p>
                  </div>
                  <Button className="bg-[#26382D] text-white">Enable 2FA</Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl border border-[#26382D]/10 p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold font-serif mb-6 text-[#1C2B22]">Email Notifications</h2>
              <div className="space-y-4">
                {[
                  { title: 'New Bookings', desc: 'Get notified when a traveler books a stay.' },
                  { title: 'AI Inspections', desc: 'Receive alerts when AI finishes processing a property.' },
                  { title: 'Marketing & Promos', desc: 'Tips on how to increase your visibility.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-[#26382D]/10 rounded-xl">
                    <div>
                      <h3 className="font-medium text-[#1C2B22]">{item.title}</h3>
                      <p className="text-sm text-[#5B6D62] mt-0.5">{item.desc}</p>
                    </div>
                    <div className="w-10 h-5 bg-green-500 rounded-full relative cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
