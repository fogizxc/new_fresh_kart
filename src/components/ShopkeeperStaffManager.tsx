import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  IndianRupee,
  Calendar,
  Clock,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Printer,
  Edit3,
  Trash2,
  Phone,
  Mail,
  FileText,
  Search,
  Filter,
  Check,
  X,
  Briefcase,
  TrendingUp,
  Receipt,
  ShieldCheck,
  Building2,
  CalendarDays,
  PlusCircle,
  ExternalLink,
  ChevronDown,
  Download,
  QrCode,
  Award,
  Shield,
  Smartphone,
  CheckCheck,
  Percent,
  Timer,
  FileSpreadsheet
} from 'lucide-react';
import {
  type ShopStaffMember,
  type StaffSalaryPayment,
  type StaffAdvance,
  type StaffSalaryStructure,
  getShopStaffList,
  createShopStaff,
  updateShopStaff,
  deleteShopStaff,
  getStaffSalariesAndAdvances,
  recordStaffSalaryPayment,
  issueStaffSalaryAdvance,
  getShopStaffAttendance,
  markShopStaffAttendance,
  punchStaffKiosk,
  getPayrollExportUrl
} from '../services/shopkeeperApi';

interface Props {
  flash: (message: string) => void;
  mode: 'shopkeeper' | 'admin';
  shopName?: string;
  shopAddress?: string;
}

type StaffViewTab = 'directory' | 'payroll' | 'advances' | 'attendance' | 'kiosk' | 'scorecard';

export const ShopkeeperStaffManager: React.FC<Props> = ({
  flash,
  mode,
  shopName = 'My Store',
  shopAddress = 'Connaught Place, Central Delhi'
}) => {
  const [activeTab, setActiveTab] = useState<StaffViewTab>('directory');
  const [staffList, setStaffList] = useState<ShopStaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'employee' | 'store_manager'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Selected staff for history / salary / advance
  const [selectedStaffForHistory, setSelectedStaffForHistory] = useState<ShopStaffMember | null>(null);
  const [staffHistory, setStaffHistory] = useState<{ payments: StaffSalaryPayment[]; advances: StaffAdvance[] }>({
    payments: [],
    advances: []
  });

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState<ShopStaffMember | null>(null);
  const [payingStaff, setPayingStaff] = useState<ShopStaffMember | null>(null);
  const [advancingStaff, setAdvancingStaff] = useState<ShopStaffMember | null>(null);
  const [activeSlip, setActiveSlip] = useState<{ payment: StaffSalaryPayment; staff: ShopStaffMember } | null>(null);

  // Attendance management state
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [savingAttendance, setSavingAttendance] = useState<string | null>(null);

  // Kiosk mode state
  const [kioskPinInput, setKioskPinInput] = useState('');
  const [kioskPunchType, setKioskPunchType] = useState<'CHECK_IN' | 'CHECK_OUT'>('CHECK_IN');
  const [kioskPunching, setKioskPunching] = useState(false);
  const [kioskResult, setKioskResult] = useState<{ staffName: string; type: string; time: string } | null>(null);

  // Selected month for payroll sheet (default current YYYY-MM)
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedPayrollMonth, setSelectedPayrollMonth] = useState(currentMonthStr);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const list = await getShopStaffList();
      setStaffList(list);
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async (monthStr: string) => {
    try {
      const res = await getShopStaffAttendance(monthStr);
      setAttendanceRecords(res.records || []);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    }
  };

  useEffect(() => {
    void loadStaff();
    void loadAttendance(selectedPayrollMonth);
  }, [selectedPayrollMonth]);

  // Handle staff history viewing
  const handleOpenHistory = async (staff: ShopStaffMember) => {
    setSelectedStaffForHistory(staff);
    try {
      const history = await getStaffSalariesAndAdvances(staff.id);
      setStaffHistory(history);
    } catch (err) {
      flash('Could not load staff salary history');
    }
  };

  // Quick attendance toggle for today/selectedDate
  const handleMarkAttendance = async (
    staffId: string,
    status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE',
    notes?: string
  ) => {
    setSavingAttendance(staffId);
    try {
      await markShopStaffAttendance({
        staffId,
        date: selectedDate,
        status,
        notes
      });
      flash(`Marked ${status} for ${selectedDate}`);
      await loadAttendance(selectedDate.slice(0, 7));
      await loadStaff();
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed to mark attendance');
    } finally {
      setSavingAttendance(null);
    }
  };

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffList.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone.includes(searchQuery) ||
        s.designation.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = filterRole === 'all' || s.role === filterRole;
      const matchesStatus =
        filterStatus === 'all' || (filterStatus === 'active' ? s.active : !s.active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [staffList, searchQuery, filterRole, filterStatus]);

  // Overall KPIs
  const totalStaffCount = staffList.length;
  const activeStaffCount = staffList.filter(s => s.active).length;
  const totalMonthlyPayroll = staffList
    .filter(s => s.active)
    .reduce((sum, s) => sum + (s.salaryStructure?.monthlyBase || 0) + (s.salaryStructure?.allowances || 0), 0);
  const totalOutstandingAdvances = staffList.reduce(
    (sum, s) => sum + (s.totalAdvanceOutstanding || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="rounded-3xl bg-white p-6 shadow-xs border border-emerald-950/10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center rounded-xl bg-emerald-100 p-2 text-emerald-800">
              <Users size={22} />
            </span>
            <h2 className="text-2xl font-black text-[#173d2e]">Staff & Salary Management</h2>
          </div>
          <p className="mt-1 text-xs text-[#5f7066]">
            Manage your store's workforce, maintain monthly salary structures, record disbursements, track advances, and monitor attendance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#173d2e] px-4 py-3 text-xs font-black text-white hover:bg-[#123125] shadow-xs transition cursor-pointer"
          >
            <UserPlus size={16} />
            <span>+ Add New Staff</span>
          </button>
          <button
            onClick={loadStaff}
            className="inline-flex items-center gap-1.5 rounded-2xl bg-[#edf4ee] px-4 py-3 text-xs font-black text-[#173d2e] border border-[#cfe3d3] hover:bg-[#dcefe0] transition cursor-pointer"
          >
            <Clock size={16} />
            <span>Refresh Roster</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 border border-emerald-950/10 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Staff</span>
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-800">
              <Users size={18} />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-[#173d2e]">{totalStaffCount}</div>
          <p className="mt-1 text-xs text-emerald-600 font-bold">
            {activeStaffCount} Active on Store Duty
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-emerald-950/10 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Monthly Payroll</span>
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-800">
              <IndianRupee size={18} />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-[#173d2e]">
            ₹{totalMonthlyPayroll.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-xs text-gray-400">Base salary + standard allowances</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-emerald-950/10 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Advances</span>
            <span className="rounded-xl bg-amber-50 p-2 text-amber-800">
              <CreditCard size={18} />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-700">
            ₹{totalOutstandingAdvances.toLocaleString('en-IN')}
          </div>
          <p className="mt-1 text-xs text-amber-600 font-medium">To be settled in upcoming salaries</p>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-emerald-950/10 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Today's Attendance</span>
            <span className="rounded-xl bg-blue-50 p-2 text-blue-800">
              <Calendar size={18} />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-blue-900">
            {attendanceRecords.filter(a => a.date === new Date().toISOString().slice(0, 10) && a.status === 'PRESENT').length} / {activeStaffCount}
          </div>
          <p className="mt-1 text-xs text-blue-600 font-medium">Checked in today</p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('directory')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition cursor-pointer ${
            activeTab === 'directory'
              ? 'bg-[#173d2e] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users size={15} />
          <span>Staff Directory ({staffList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition cursor-pointer ${
            activeTab === 'payroll'
              ? 'bg-[#173d2e] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Receipt size={15} />
          <span>Monthly Payroll & Slips</span>
        </button>

        <button
          onClick={() => setActiveTab('advances')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition cursor-pointer ${
            activeTab === 'advances'
              ? 'bg-[#173d2e] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <CreditCard size={15} />
          <span>Salary Advances & Loans</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition cursor-pointer ${
            activeTab === 'attendance'
              ? 'bg-[#173d2e] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <CalendarDays size={15} />
          <span>Daily Attendance & Shifts</span>
        </button>

        <button
          onClick={() => setActiveTab('kiosk')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition cursor-pointer ${
            activeTab === 'kiosk'
              ? 'bg-[#173d2e] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Smartphone size={15} />
          <span>Tablet / Counter Kiosk</span>
        </button>

        <button
          onClick={() => setActiveTab('scorecard')}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black transition cursor-pointer ${
            activeTab === 'scorecard'
              ? 'bg-[#173d2e] text-white shadow-xs'
              : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Award size={15} />
          <span>Performance & Roles</span>
        </button>
      </div>

      {/* TAB 1: STAFF DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-emerald-950/10 shadow-xs">
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search staff by name, phone, or designation..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-gray-50 pl-9 pr-4 py-2 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-600 border border-gray-200"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterRole}
                onChange={e => setFilterRole(e.target.value as any)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 outline-none"
              >
                <option value="all">All Roles</option>
                <option value="employee">Staff / Riders / Packers</option>
                <option value="store_manager">Store Supervisors</option>
              </select>

              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 outline-none"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>

          {/* Staff Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredStaff.map(staff => {
              const base = staff.salaryStructure?.monthlyBase || 0;
              const allow = staff.salaryStructure?.allowances || 0;
              const ded = staff.salaryStructure?.deductions || 0;
              const netExpected = Math.max(0, base + allow - ded);

              return (
                <div
                  key={staff.id}
                  className={`rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-md flex flex-col justify-between ${
                    staff.active ? 'border-gray-200' : 'border-rose-200 bg-rose-50/20 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-black text-emerald-900 border border-emerald-200">
                          {staff.name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-[#173d2e] leading-snug">{staff.name}</h3>
                          <p className="text-[11px] font-bold text-emerald-800">{staff.designation}</p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                          staff.active
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {staff.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Contact & Shift Info */}
                    <div className="mt-4 space-y-1.5 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <Phone size={13} className="text-gray-400" />
                        <span className="font-mono">{staff.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={13} className="text-gray-400" />
                        <span className="truncate">{staff.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={13} className="text-gray-400" />
                        <span>Shift: <b>{staff.shift}</b></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-gray-400" />
                        <span>Joined: {staff.joiningDate}</span>
                      </div>
                    </div>

                    {/* Salary Summary Card */}
                    <div className="mt-4 rounded-xl bg-emerald-50/70 p-3 border border-emerald-100 text-xs">
                      <div className="flex items-center justify-between font-bold text-gray-700">
                        <span>Base Salary:</span>
                        <span className="text-[#173d2e]">₹{base.toLocaleString('en-IN')}/mo</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                        <span>Allowances: +₹{allow}</span>
                        <span>Deductions: -₹{ded}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between font-black text-[#173d2e]">
                        <span>Net Standard Pay:</span>
                        <span className="text-sm text-emerald-800">₹{netExpected.toLocaleString('en-IN')}</span>
                      </div>

                      {staff.totalAdvanceOutstanding > 0 && (
                        <div className="mt-2 rounded-lg bg-amber-100 px-2 py-1 text-[11px] font-black text-amber-900 flex items-center justify-between">
                          <span>Pending Advance:</span>
                          <span>₹{staff.totalAdvanceOutstanding.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>

                    {/* Attendance & Performance Pill */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 bg-gray-50 rounded-xl p-2 border border-gray-100">
                        <span>Attendance (30d):</span>
                        <span className="font-black text-emerald-800">
                          {staff.attendanceThisMonth?.present || 0} Present / {staff.attendanceThisMonth?.leave || 0} Leave
                        </span>
                      </div>

                      {/* Performance Scorecard snippet */}
                      {(staff.performance?.ordersHandled !== undefined || staff.kioskPin) && (
                        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                          <div className="rounded-lg bg-emerald-50/70 p-1.5 border border-emerald-100 flex items-center justify-between">
                            <span className="text-gray-500 font-bold">Deliveries:</span>
                            <span className="font-black text-[#173d2e]">{staff.performance?.ordersHandled || 0}</span>
                          </div>
                          <div className="rounded-lg bg-amber-50/70 p-1.5 border border-amber-100 flex items-center justify-between">
                            <span className="text-gray-500 font-bold">Kiosk PIN:</span>
                            <span className="font-mono font-black text-amber-900">{staff.kioskPin || 'Not set'}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="mt-5 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-1.5">
                    <button
                      onClick={() => setPayingStaff(staff)}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 px-2.5 py-1.5 text-[11px] font-black text-white hover:bg-emerald-800 transition cursor-pointer"
                    >
                      <Receipt size={13} />
                      <span>Pay Salary</span>
                    </button>

                    <button
                      onClick={() => setAdvancingStaff(staff)}
                      className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1.5 text-[11px] font-black text-amber-900 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                    >
                      <CreditCard size={13} />
                      <span>Advance</span>
                    </button>

                    <button
                      onClick={() => handleOpenHistory(staff)}
                      className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-2.5 py-1.5 text-[11px] font-black text-gray-700 hover:bg-gray-200 transition cursor-pointer"
                      title="View Salary Slips & History"
                    >
                      <FileText size={13} />
                      <span>History</span>
                    </button>

                    <button
                      onClick={() => setEditingStaff(staff)}
                      className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
                      title="Edit Profile & Salary Structure"
                    >
                      <Edit3 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}

            {!filteredStaff.length && (
              <div className="col-span-full py-16 text-center rounded-3xl border border-dashed border-gray-200 bg-white">
                <Users size={36} className="mx-auto text-gray-300" />
                <h4 className="mt-2 text-sm font-black text-gray-700">No staff members found</h4>
                <p className="mt-1 text-xs text-gray-400">
                  {searchQuery ? 'Try adjusting your search filters' : 'Add your first staff member to start managing your workforce and payroll.'}
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#173d2e] px-4 py-2 text-xs font-black text-white"
                >
                  <UserPlus size={14} />
                  <span>Add First Staff</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MONTHLY PAYROLL & SLIPS */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-emerald-950/10 shadow-xs">
            <div>
              <h3 className="text-base font-black text-[#173d2e]">Monthly Payroll Register</h3>
              <p className="text-xs text-gray-500">
                Generate, disburse and issue salary slips for staff for the selected month with automated attendance & incentive calculation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                <label className="text-xs font-bold text-gray-600">Month:</label>
                <input
                  type="month"
                  value={selectedPayrollMonth}
                  onChange={e => setSelectedPayrollMonth(e.target.value)}
                  className="bg-transparent text-xs font-black text-gray-800 outline-none"
                />
              </div>

              {/* Export Buttons */}
              <a
                href={getPayrollExportUrl(selectedPayrollMonth, 'payroll')}
                download={`Payroll_Register_${selectedPayrollMonth}.csv`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#edf4ee] px-3 py-2 text-xs font-black text-[#173d2e] border border-[#cfe3d3] hover:bg-[#dcefe0] transition cursor-pointer"
              >
                <Download size={14} />
                <span>Export CSV</span>
              </a>

              <a
                href={getPayrollExportUrl(selectedPayrollMonth, 'neft')}
                download={`Bank_NEFT_Batch_${selectedPayrollMonth}.csv`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-blue-900 border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                title="Download standard CSV format for HDFC / ICICI / SBI corporate salary batch transfers"
              >
                <Building2 size={14} />
                <span>Bank NEFT Batch</span>
              </a>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-[#f7faf8] text-[11px] font-black uppercase tracking-wider text-[#173d2e] border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3.5">Staff Name & Role</th>
                  <th className="px-4 py-3.5">Attendance</th>
                  <th className="px-4 py-3.5">Base Pay</th>
                  <th className="px-4 py-3.5">Allowances</th>
                  <th className="px-4 py-3.5">Incentives/Bonus</th>
                  <th className="px-4 py-3.5">Advance Deduct</th>
                  <th className="px-4 py-3.5">Net Payout</th>
                  <th className="px-4 py-3.5">Payment Mode</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {staffList.map(staff => {
                  const base = staff.salaryStructure?.monthlyBase || 0;
                  const allow = staff.salaryStructure?.allowances || 0;
                  const payment = staff.latestPayment?.month === selectedPayrollMonth ? staff.latestPayment : null;
                  const isPaid = Boolean(payment && payment.status === 'PAID');
                  const presentCount = staff.attendanceThisMonth?.present || 0;
                  const halfDayCount = staff.attendanceThisMonth?.halfDay || 0;

                  return (
                    <tr key={staff.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-black text-[#173d2e]">{staff.name}</div>
                        <div className="text-[10px] text-gray-400">{staff.designation} • {staff.phone}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
                          {presentCount}P {halfDayCount > 0 ? `+ ${halfDayCount}H` : ''}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-gray-800">₹{base.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3.5 text-emerald-700 font-bold">+₹{allow.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3.5 text-emerald-700 font-bold">
                        {payment ? `+₹${(payment.bonusAmount || 0) + (payment.commissionAmount || 0) + (payment.tipAmount || 0)}` : '—'}
                      </td>
                      <td className="px-4 py-3.5 text-rose-700 font-bold">
                        {payment ? `-₹${payment.advanceDeduction}` : (staff.totalAdvanceOutstanding > 0 ? `Pending: ₹${staff.totalAdvanceOutstanding}` : '₹0')}
                      </td>
                      <td className="px-4 py-3.5 font-black text-sm text-[#173d2e]">
                        ₹{(payment ? payment.netPaid : Math.max(0, base + allow)).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-700">
                          {payment ? payment.paymentMode : staff.salaryStructure?.paymentMethod || 'UPI'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isPaid ? <Check size={11} /> : null}
                          {isPaid ? 'PAID' : 'PENDING'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPaid && payment ? (
                            <button
                              onClick={() => setActiveSlip({ payment, staff })}
                              className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer"
                            >
                              <Printer size={13} />
                              <span>Salary Slip</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setPayingStaff(staff)}
                              className="inline-flex items-center gap-1 rounded-xl bg-[#173d2e] px-3 py-1.5 text-xs font-black text-white hover:bg-[#123125] transition cursor-pointer"
                            >
                              <Receipt size={13} />
                              <span>Pay Now</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SALARY ADVANCES & LOANS */}
      {activeTab === 'advances' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-emerald-950/10 shadow-xs">
            <div>
              <h3 className="text-base font-black text-[#173d2e]">Staff Advances & Emergency Loans</h3>
              <p className="text-xs text-gray-500">
                Track cash advances given to employees and automatically deduct them during monthly payroll.
              </p>
            </div>

            <button
              onClick={() => {
                if (staffList.length > 0) {
                  setAdvancingStaff(staffList[0]);
                } else {
                  flash('Add a staff member first');
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-black text-white hover:bg-amber-700 transition cursor-pointer"
            >
              <CreditCard size={14} />
              <span>+ Issue New Advance</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {staffList
              .filter(s => s.totalAdvanceOutstanding > 0)
              .map(staff => (
                <div key={staff.id} className="rounded-2xl border border-amber-200 bg-amber-50/40 p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-[#173d2e] text-sm">{staff.name}</h4>
                      <p className="text-xs text-gray-500">{staff.designation}</p>
                    </div>
                    <span className="rounded-xl bg-amber-100 p-2 text-amber-800 font-black text-xs">
                      ₹{staff.totalAdvanceOutstanding.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="mt-4 text-xs text-gray-600 space-y-1">
                    <p><b>Monthly Base:</b> ₹{staff.salaryStructure?.monthlyBase || 0}</p>
                    <p className="text-amber-800 font-bold">
                      Pending recovery from upcoming salary disbursement.
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenHistory(staff)}
                      className="text-xs font-black text-emerald-800 hover:underline cursor-pointer"
                    >
                      View Advance Records →
                    </button>
                    <button
                      onClick={() => setPayingStaff(staff)}
                      className="rounded-xl bg-[#173d2e] px-2.5 py-1 text-xs font-black text-white"
                    >
                      Deduct in Salary
                    </button>
                  </div>
                </div>
              ))}

            {!staffList.some(s => s.totalAdvanceOutstanding > 0) && (
              <div className="col-span-full py-16 text-center rounded-3xl border border-dashed border-gray-200 bg-white">
                <CheckCircle2 size={36} className="mx-auto text-emerald-500" />
                <h4 className="mt-2 text-sm font-black text-[#173d2e]">No Outstanding Advances</h4>
                <p className="mt-1 text-xs text-gray-400">All staff advances have been fully recovered or none have been issued.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DAILY ATTENDANCE & SHIFTS */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 border border-emerald-950/10 shadow-xs">
            <div>
              <h3 className="text-base font-black text-[#173d2e]">Daily Staff Attendance & Shifts</h3>
              <p className="text-xs text-gray-500">
                Mark, override, and review daily attendance logs for each staff member.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-gray-600">Select Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-800 outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-[#f7faf8] text-[11px] font-black uppercase tracking-wider text-[#173d2e] border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3.5">Staff Member</th>
                  <th className="px-4 py-3.5">Assigned Shift</th>
                  <th className="px-4 py-3.5">Check-In / Out</th>
                  <th className="px-4 py-3.5">Current Status</th>
                  <th className="px-4 py-3.5 text-right">Quick Mark Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {staffList.filter(s => s.active).map(staff => {
                  const record = attendanceRecords.find(a => a.userId === staff.id && a.date === selectedDate);
                  const status = record?.status || 'NOT_MARKED';

                  return (
                    <tr key={staff.id} className="hover:bg-gray-50/80 transition">
                      <td className="px-4 py-3.5">
                        <div className="font-black text-[#173d2e]">{staff.name}</div>
                        <div className="text-[10px] text-gray-400">{staff.designation}</div>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-gray-700">{staff.shift}</td>
                      <td className="px-4 py-3.5 font-mono text-[11px]">
                        {record?.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        {' → '}
                        {record?.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            status === 'PRESENT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : status === 'HALF_DAY'
                              ? 'bg-amber-100 text-amber-800'
                              : status === 'ABSENT'
                              ? 'bg-rose-100 text-rose-800'
                              : status === 'LEAVE'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            disabled={savingAttendance === staff.id}
                            onClick={() => handleMarkAttendance(staff.id, 'PRESENT')}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-black transition cursor-pointer ${
                              status === 'PRESENT'
                                ? 'bg-emerald-700 text-white'
                                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            disabled={savingAttendance === staff.id}
                            onClick={() => handleMarkAttendance(staff.id, 'HALF_DAY')}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-black transition cursor-pointer ${
                              status === 'HALF_DAY'
                                ? 'bg-amber-600 text-white'
                                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                            }`}
                          >
                            Half-Day
                          </button>
                          <button
                            disabled={savingAttendance === staff.id}
                            onClick={() => handleMarkAttendance(staff.id, 'LEAVE')}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-black transition cursor-pointer ${
                              status === 'LEAVE'
                                ? 'bg-blue-600 text-white'
                                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                            }`}
                          >
                            Leave
                          </button>
                          <button
                            disabled={savingAttendance === staff.id}
                            onClick={() => handleMarkAttendance(staff.id, 'ABSENT')}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-black transition cursor-pointer ${
                              status === 'ABSENT'
                                ? 'bg-rose-600 text-white'
                                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: TABLET / COUNTER ATTENDANCE KIOSK */}
      {activeTab === 'kiosk' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kiosk Punch Pad */}
          <div className="lg:col-span-2 rounded-3xl bg-white p-6 sm:p-8 border border-emerald-950/10 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
                  <QrCode size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#173d2e]">Staff Attendance Kiosk</h3>
                  <p className="text-xs text-gray-500">
                    Mount this screen on your store's counter or billing tablet. Staff enter their 4-digit PIN to punch.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black uppercase text-emerald-900 animate-pulse">
                Live Terminal
              </span>
            </div>

            {/* Check-In vs Check-Out Selector */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => setKioskPunchType('CHECK_IN')}
                className={`flex items-center justify-center gap-2 rounded-2xl py-3 px-4 text-xs font-black transition cursor-pointer ${
                  kioskPunchType === 'CHECK_IN'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <CheckCircle2 size={16} />
                <span>Punch IN (Shift Start)</span>
              </button>
              <button
                type="button"
                onClick={() => setKioskPunchType('CHECK_OUT')}
                className={`flex items-center justify-center gap-2 rounded-2xl py-3 px-4 text-xs font-black transition cursor-pointer ${
                  kioskPunchType === 'CHECK_OUT'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Clock size={16} />
                <span>Punch OUT (Shift End)</span>
              </button>
            </div>

            {/* PIN Display & Keypad */}
            <div className="max-w-xs mx-auto space-y-4">
              <div className="flex items-center justify-center gap-3 py-3 px-4 bg-gray-50 rounded-2xl border border-gray-200">
                {[0, 1, 2, 3].map(idx => (
                  <div
                    key={idx}
                    className={`h-11 w-11 rounded-xl border-2 flex items-center justify-center text-xl font-mono font-black ${
                      kioskPinInput[idx]
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-gray-200 bg-white text-gray-300'
                    }`}
                  >
                    {kioskPinInput[idx] ? '●' : ''}
                  </div>
                ))}
              </div>

              {/* Number pad */}
              <div className="grid grid-cols-3 gap-2.5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={async () => {
                      if (key === 'C') {
                        setKioskPinInput('');
                      } else if (key === '⌫') {
                        setKioskPinInput(prev => prev.slice(0, -1));
                      } else if (kioskPinInput.length < 4) {
                        const newPin = kioskPinInput + key;
                        setKioskPinInput(newPin);

                        // Auto-submit on 4 digits
                        if (newPin.length === 4) {
                          setKioskPunching(true);
                          try {
                            const res = await punchStaffKiosk({
                              pin: newPin,
                              action: kioskPunchType === 'CHECK_IN' ? 'check_in' : 'check_out'
                            });
                            if (res.success && res.staffName) {
                              setKioskResult({
                                staffName: res.staffName,
                                type: kioskPunchType,
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              });
                              flash(`${kioskPunchType === 'CHECK_IN' ? 'Checked in' : 'Checked out'}: ${res.staffName}`);
                              await loadAttendance(selectedPayrollMonth);
                              await loadStaff();
                            }
                          } catch (err) {
                            flash(err instanceof Error ? err.message : 'Invalid PIN or store error');
                          } finally {
                            setKioskPunching(false);
                            setKioskPinInput('');
                          }
                        }
                      }
                    }}
                    disabled={kioskPunching}
                    className="h-14 rounded-2xl bg-gray-50 border border-gray-200/80 text-base font-black text-gray-800 hover:bg-gray-100 active:scale-95 transition cursor-pointer disabled:opacity-50"
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>

            {/* Success result feedback banner */}
            {kioskResult && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 max-w-md mx-auto flex items-center gap-3">
                <CheckCircle2 size={24} className="text-emerald-700 shrink-0" />
                <div>
                  <h4 className="text-xs font-black text-emerald-900">
                    Punch Recorded: {kioskResult.staffName}
                  </h4>
                  <p className="text-[11px] text-emerald-700">
                    {kioskResult.type === 'CHECK_IN' ? 'Checked in' : 'Checked out'} at {kioskResult.time} today.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick PIN Reference Card for Shopkeeper */}
          <div className="rounded-3xl bg-white p-6 border border-emerald-950/10 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-emerald-700" />
              <h4 className="text-sm font-black text-[#173d2e]">Staff Kiosk PIN Directory</h4>
            </div>
            <p className="text-xs text-gray-500">
              Each staff member punches with their unique 4-digit PIN. You can assign or edit PINs from the Staff Directory tab.
            </p>

            <div className="divide-y divide-gray-100 max-h-[380px] overflow-y-auto pr-1">
              {staffList.filter(s => s.active).map(staff => (
                <div key={staff.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-gray-800">{staff.name}</div>
                    <div className="text-[10px] text-gray-400">{staff.designation}</div>
                  </div>
                  <span className="font-mono text-xs font-black rounded-lg bg-gray-100 px-2.5 py-1 text-gray-700 border border-gray-200">
                    {staff.kioskPin || 'No PIN'}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-blue-50 p-3 border border-blue-100 text-[11px] text-blue-900">
              <span className="font-black">Counter Tablet Tip:</span> Keep this kiosk tab open on full-screen when staff arrive or leave the store.
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: STAFF PERFORMANCE SCORECARD & RBAC */}
      {activeTab === 'scorecard' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-white p-6 border border-emerald-950/10 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Award className="text-emerald-700" size={22} />
                <h3 className="text-lg font-black text-[#173d2e]">Staff Performance & Role Permissions</h3>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Monitor fulfillment deliveries, track commission earned, and manage granular module access for store staff.
              </p>
            </div>
            <div className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
              Active Store Team: <span className="font-black text-emerald-800">{staffList.filter(s => s.active).length} Members</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map(staff => {
              const ordersHandled = staff.performance?.ordersHandled || 0;
              const commissionEarned = staff.performance?.commissionEarned || 0;
              const tipsCollected = staff.performance?.tipsEarned || 0;
              const allowedModules = staff.allowedModules || ['pos', 'inventory', 'orders'];

              return (
                <div key={staff.id} className="rounded-3xl bg-white p-5 border border-emerald-950/10 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-black text-sm text-[#173d2e]">{staff.name}</h4>
                        <p className="text-[11px] font-bold text-emerald-800">{staff.designation} • {staff.role}</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase text-emerald-800">
                        {staff.shift.split(' ')[0]}
                      </span>
                    </div>

                    {/* Performance metrics */}
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-2xl bg-gray-50 p-2.5 border border-gray-100">
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Deliveries</p>
                        <p className="text-base font-black text-[#173d2e] mt-0.5">{ordersHandled}</p>
                      </div>
                      <div className="rounded-2xl bg-emerald-50 p-2.5 border border-emerald-100">
                        <p className="text-[10px] font-bold text-emerald-800 uppercase">Commission</p>
                        <p className="text-base font-black text-emerald-900 mt-0.5">₹{commissionEarned}</p>
                      </div>
                      <div className="rounded-2xl bg-amber-50 p-2.5 border border-amber-100">
                        <p className="text-[10px] font-bold text-amber-800 uppercase">Tips</p>
                        <p className="text-base font-black text-amber-900 mt-0.5">₹{tipsCollected}</p>
                      </div>
                    </div>

                    {/* Module permissions list */}
                    <div className="mt-4 pt-3 border-t border-gray-100 space-y-1.5">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-500">Allowed Portal Modules:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {allowedModules.map(m => (
                          <span key={m} className="rounded-md bg-[#edf4ee] px-2 py-0.5 text-[10px] font-bold text-[#173d2e] border border-[#cfe3d3]">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-gray-500">PIN: {staff.kioskPin || 'None'}</span>
                    <button
                      onClick={() => setEditingStaff(staff)}
                      className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-3 py-1.5 text-xs font-black text-gray-700 hover:bg-gray-200 transition cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>Edit Roles & PIN</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: ADD NEW STAFF MEMBER                                */}
      {/* ============================================================ */}
      {showAddModal && (
        <AddStaffModal
          onClose={() => setShowAddModal(false)}
          onSuccess={async newStaff => {
            setShowAddModal(false);
            flash(`Added ${newStaff.name} to shop workforce!`);
            await loadStaff();
          }}
          flash={flash}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 2: EDIT STAFF & SALARY STRUCTURE                       */}
      {/* ============================================================ */}
      {editingStaff && (
        <EditStaffModal
          staff={editingStaff}
          onClose={() => setEditingStaff(null)}
          onSuccess={async () => {
            setEditingStaff(null);
            flash('Staff profile and salary updated successfully!');
            await loadStaff();
          }}
          flash={flash}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 3: PAY MONTHLY SALARY                                  */}
      {/* ============================================================ */}
      {payingStaff && (
        <PaySalaryModal
          staff={payingStaff}
          defaultMonth={selectedPayrollMonth}
          onClose={() => setPayingStaff(null)}
          onSuccess={async (payment, staffObj) => {
            setPayingStaff(null);
            flash(`Salary of ₹${payment.netPaid} recorded for ${staffObj.name}`);
            await loadStaff();
            setActiveSlip({ payment, staff: staffObj });
          }}
          flash={flash}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 4: ISSUE STAFF SALARY ADVANCE                          */}
      {/* ============================================================ */}
      {advancingStaff && (
        <IssueAdvanceModal
          staff={advancingStaff}
          staffList={staffList}
          onClose={() => setAdvancingStaff(null)}
          onSuccess={async (advance) => {
            setAdvancingStaff(null);
            flash(`Advance of ₹${advance.amount} recorded!`);
            await loadStaff();
          }}
          flash={flash}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 5: SALARY SLIP / PAYMENT VOUCHER PRINT VIEW            */}
      {/* ============================================================ */}
      {activeSlip && (
        <SalarySlipModal
          payment={activeSlip.payment}
          staff={activeSlip.staff}
          shopName={shopName}
          shopAddress={shopAddress}
          onClose={() => setActiveSlip(null)}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL 6: STAFF SALARY & ADVANCE HISTORY                      */}
      {/* ============================================================ */}
      {selectedStaffForHistory && (
        <StaffHistoryModal
          staff={selectedStaffForHistory}
          history={staffHistory}
          onClose={() => setSelectedStaffForHistory(null)}
          onViewSlip={(payment) => setActiveSlip({ payment, staff: selectedStaffForHistory })}
        />
      )}
    </div>
  );
};

// ============================================================
// SUB-COMPONENT: ADD STAFF MODAL
// ============================================================
function AddStaffModal({
  onClose,
  onSuccess,
  flash
}: {
  onClose: () => void;
  onSuccess: (newStaff: ShopStaffMember) => void;
  flash: (msg: string) => void;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'employee' | 'store_manager'>('employee');
  const [designation, setDesignation] = useState('Store Assistant / Runner');
  const [shift, setShift] = useState('General (09:00 - 18:00)');
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().slice(0, 10));
  const [emergencyContact, setEmergencyContact] = useState('');
  const [kioskPin, setKioskPin] = useState(Math.floor(1000 + Math.random() * 9000).toString());
  const [allowedModules, setAllowedModules] = useState<string[]>(['pos', 'inventory', 'orders']);

  // Salary Structure
  const [monthlyBase, setMonthlyBase] = useState(16000);
  const [allowances, setAllowances] = useState(1500);
  const [deductions, setDeductions] = useState(500);
  const [paidLeavesAllowance, setPaidLeavesAllowance] = useState(2);
  const [overtimeHourlyRate, setOvertimeHourlyRate] = useState(100);
  const [commissionPerDelivery, setCommissionPerDelivery] = useState(25);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH' | 'BANK_TRANSFER'>('UPI');
  const [upiId, setUpiId] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [password, setPassword] = useState('Staff@123');
  const [submitting, setSubmitting] = useState(false);

  const toggleModule = (moduleKey: string) => {
    setAllowedModules(prev =>
      prev.includes(moduleKey) ? prev.filter(m => m !== moduleKey) : [...prev, moduleKey]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return flash('Staff name is required');
    if (!phone.trim()) return flash('Phone number is required');

    setSubmitting(true);
    try {
      const res = await createShopStaff({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        role,
        designation,
        shift,
        joiningDate,
        emergencyContact: emergencyContact.trim() || undefined,
        kioskPin: kioskPin.trim() || undefined,
        allowedModules,
        salaryStructure: {
          monthlyBase: Number(monthlyBase) || 0,
          allowances: Number(allowances) || 0,
          deductions: Number(deductions) || 0,
          paidLeavesAllowance: Number(paidLeavesAllowance) || 0,
          overtimeHourlyRate: Number(overtimeHourlyRate) || 0,
          commissionPerDelivery: Number(commissionPerDelivery) || 0,
          paymentMethod,
          upiId: upiId.trim() || undefined,
          bankAccountNo: bankAccountNo.trim() || undefined,
          bankIfsc: bankIfsc.trim() || undefined
        },
        password: password.trim() || undefined
      });

      if (res.success && res.staff) {
        onSuccess(res.staff);
      }
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed to add staff');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#173d2e]">Add New Staff Member</h3>
              <p className="text-xs text-gray-500">Add personal details, assigned shift, and salary package.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Section 1: Basic Details */}
          <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200/80 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">1. Staff Identity & Role</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9811002233"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. ramesh@store.local"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">System Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="employee">Employee / Staff / Rider</option>
                  <option value="store_manager">Store Supervisor / Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Designation / Role Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Cashier, Lead Packer, Delivery Rider"
                  value={designation}
                  onChange={e => setDesignation(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Assigned Shift</label>
                <select
                  value={shift}
                  onChange={e => setShift(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="Morning (07:00 - 15:30)">Morning (07:00 - 15:30)</option>
                  <option value="General (09:00 - 18:00)">General (09:00 - 18:00)</option>
                  <option value="Evening (14:00 - 22:30)">Evening (14:00 - 22:30)</option>
                  <option value="Flexible (10:00 - 19:30)">Flexible (10:00 - 19:30)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Joining Date</label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={e => setJoiningDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Emergency Contact Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. 9899112233"
                  value={emergencyContact}
                  onChange={e => setEmergencyContact(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Salary Structure */}
          <div className="rounded-2xl bg-emerald-50/60 p-4 border border-emerald-100 space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900">2. Monthly Salary Structure & Payout</h4>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Base Salary (₹ / mo) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={monthlyBase}
                  onChange={e => setMonthlyBase(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Allowances (Fuel/Food) ₹</label>
                <input
                  type="number"
                  min="0"
                  value={allowances}
                  onChange={e => setAllowances(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Standard Deductions ₹</label>
                <input
                  type="number"
                  min="0"
                  value={deductions}
                  onChange={e => setDeductions(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            {/* Incentives & Leaves */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-1 border-t border-emerald-100">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Paid Leaves (Days/mo)</label>
                <input
                  type="number"
                  min="0"
                  value={paidLeavesAllowance}
                  onChange={e => setPaidLeavesAllowance(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Overtime Rate (₹/hr)</label>
                <input
                  type="number"
                  min="0"
                  value={overtimeHourlyRate}
                  onChange={e => setOvertimeHourlyRate(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Commission (₹/order)</label>
                <input
                  type="number"
                  min="0"
                  value={commissionPerDelivery}
                  onChange={e => setCommissionPerDelivery(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="BANK_TRANSFER">Direct Bank Transfer (NEFT/IMPS)</option>
                  <option value="CASH">Cash in Hand Voucher</option>
                </select>
              </div>

              {paymentMethod === 'UPI' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">UPI ID</label>
                  <input
                    type="text"
                    placeholder="e.g. mobile@upi or name@oksbi"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
              )}

              {paymentMethod === 'BANK_TRANSFER' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Bank Account Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 501002341901"
                      value={bankAccountNo}
                      onChange={e => setBankAccountNo(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Bank IFSC Code</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC0000240"
                      value={bankIfsc}
                      onChange={e => setBankIfsc(e.target.value)}
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="rounded-xl bg-white p-3 border border-emerald-200 flex items-center justify-between text-xs">
              <span className="font-bold text-gray-700">Calculated Net Monthly Payout:</span>
              <span className="text-base font-black text-emerald-800">
                ₹{Math.max(0, monthlyBase + allowances - deductions).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Section 3: Attendance Kiosk PIN & Role Permissions */}
          <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-gray-700">3. Kiosk PIN & Allowed Modules</h4>
              <Shield size={16} className="text-emerald-700" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Counter Kiosk 4-Digit PIN</label>
              <input
                type="text"
                maxLength={4}
                value={kioskPin}
                onChange={e => setKioskPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-36 font-mono tracking-widest rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-black text-center"
              />
              <span className="ml-2 text-[11px] text-gray-500">Staff punches this PIN on the counter tablet terminal</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Allowed Shop Modules (RBAC)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'pos', label: 'POS Billing' },
                  { key: 'inventory', label: 'Inventory' },
                  { key: 'orders', label: 'Order Dispatch' },
                  { key: 'customers', label: 'Customers' }
                ].map(mod => {
                  const checked = allowedModules.includes(mod.key);
                  return (
                    <button
                      key={mod.key}
                      type="button"
                      onClick={() => toggleModule(mod.key)}
                      className={`flex items-center justify-between rounded-xl p-2 text-xs font-bold transition cursor-pointer border ${
                        checked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <span>{mod.label}</span>
                      {checked ? <Check size={14} className="text-emerald-700" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 4: Credentials */}
          <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200/80 space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">4. Initial App Login Password</h4>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full max-w-xs rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-mono font-bold"
              />
              <span className="text-[11px] text-gray-500">Staff can log in with their phone and this password.</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-black text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#173d2e] px-5 py-2.5 text-xs font-black text-white hover:bg-[#123125] transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving Staff...' : 'Confirm & Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: EDIT STAFF & SALARY STRUCTURE MODAL
// ============================================================
function EditStaffModal({
  staff,
  onClose,
  onSuccess,
  flash
}: {
  staff: ShopStaffMember;
  onClose: () => void;
  onSuccess: () => void;
  flash: (msg: string) => void;
}) {
  const [name, setName] = useState(staff.name);
  const [phone, setPhone] = useState(staff.phone);
  const [email, setEmail] = useState(staff.email);
  const [role, setRole] = useState<'employee' | 'store_manager'>(staff.role);
  const [designation, setDesignation] = useState(staff.designation);
  const [shift, setShift] = useState(staff.shift);
  const [active, setActive] = useState(staff.active);
  const [emergencyContact, setEmergencyContact] = useState(staff.emergencyContact || '');
  const [kioskPin, setKioskPin] = useState(staff.kioskPin || '');
  const [allowedModules, setAllowedModules] = useState<string[]>(
    staff.allowedModules && staff.allowedModules.length > 0
      ? staff.allowedModules
      : ['pos', 'inventory', 'orders']
  );

  // Salary & Incentive Structure
  const [monthlyBase, setMonthlyBase] = useState(staff.salaryStructure?.monthlyBase || 15000);
  const [allowances, setAllowances] = useState(staff.salaryStructure?.allowances || 0);
  const [deductions, setDeductions] = useState(staff.salaryStructure?.deductions || 0);
  const [paidLeavesAllowance, setPaidLeavesAllowance] = useState(staff.salaryStructure?.paidLeavesAllowance || 2);
  const [overtimeHourlyRate, setOvertimeHourlyRate] = useState(staff.salaryStructure?.overtimeHourlyRate || 100);
  const [commissionPerDelivery, setCommissionPerDelivery] = useState(staff.salaryStructure?.commissionPerDelivery || 25);
  const [paymentMethod, setPaymentMethod] = useState(staff.salaryStructure?.paymentMethod || 'UPI');
  const [upiId, setUpiId] = useState(staff.salaryStructure?.upiId || '');
  const [bankAccountNo, setBankAccountNo] = useState(staff.salaryStructure?.bankAccountNo || '');
  const [bankIfsc, setBankIfsc] = useState(staff.salaryStructure?.bankIfsc || '');
  const [submitting, setSubmitting] = useState(false);

  const toggleModule = (moduleKey: string) => {
    setAllowedModules(prev =>
      prev.includes(moduleKey) ? prev.filter(m => m !== moduleKey) : [...prev, moduleKey]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateShopStaff(staff.id, {
        name,
        phone,
        email,
        role,
        designation,
        shift,
        active,
        emergencyContact,
        kioskPin: kioskPin.trim() || undefined,
        allowedModules,
        salaryStructure: {
          monthlyBase: Number(monthlyBase) || 0,
          allowances: Number(allowances) || 0,
          deductions: Number(deductions) || 0,
          paidLeavesAllowance: Number(paidLeavesAllowance) || 0,
          overtimeHourlyRate: Number(overtimeHourlyRate) || 0,
          commissionPerDelivery: Number(commissionPerDelivery) || 0,
          paymentMethod,
          upiId,
          bankAccountNo,
          bankIfsc
        }
      });
      onSuccess();
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <Edit3 className="text-emerald-700" size={20} />
            <h3 className="text-lg font-black text-[#173d2e]">Edit Staff & Salary: {staff.name}</h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Role / Designation</label>
              <input
                type="text"
                value={designation}
                onChange={e => setDesignation(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Shift</label>
              <input
                type="text"
                value={shift}
                onChange={e => setShift(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold"
              />
            </div>
          </div>

          {/* Salary Structure Fields */}
          <div className="rounded-2xl bg-emerald-50/60 p-4 border border-emerald-100 space-y-3">
            <h4 className="text-xs font-black uppercase text-emerald-900">Salary Package</h4>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Base Salary (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={monthlyBase}
                  onChange={e => setMonthlyBase(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Allowances (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={allowances}
                  onChange={e => setAllowances(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Deductions (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={deductions}
                  onChange={e => setDeductions(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
            </div>

            {/* Paid Leaves, Overtime, & Commission */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-emerald-100">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Paid Leaves (days/mo)</label>
                <input
                  type="number"
                  min="0"
                  value={paidLeavesAllowance}
                  onChange={e => setPaidLeavesAllowance(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Overtime Rate (₹/hr)</label>
                <input
                  type="number"
                  min="0"
                  value={overtimeHourlyRate}
                  onChange={e => setOvertimeHourlyRate(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Commission (₹/order)</label>
                <input
                  type="number"
                  min="0"
                  value={commissionPerDelivery}
                  onChange={e => setCommissionPerDelivery(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                >
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>
              {paymentMethod === 'UPI' && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">UPI ID</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-bold"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Section: Attendance Kiosk PIN & Role Permissions */}
          <div className="rounded-2xl bg-gray-50 p-4 border border-gray-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase text-gray-700">Attendance PIN & Portal Permissions</h4>
              <Shield size={16} className="text-emerald-700" />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Counter Kiosk 4-Digit PIN</label>
              <input
                type="text"
                maxLength={4}
                placeholder="e.g. 1234"
                value={kioskPin}
                onChange={e => setKioskPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                className="w-40 font-mono tracking-widest rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-black"
              />
              <span className="ml-2 text-[11px] text-gray-500">Used by staff to punch in/out on shop terminal</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Allowed Shop Modules (RBAC)</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'pos', label: 'POS Billing' },
                  { key: 'inventory', label: 'Inventory' },
                  { key: 'orders', label: 'Order Dispatch' },
                  { key: 'customers', label: 'Customers' }
                ].map(mod => {
                  const checked = allowedModules.includes(mod.key);
                  return (
                    <button
                      key={mod.key}
                      type="button"
                      onClick={() => toggleModule(mod.key)}
                      className={`flex items-center justify-between rounded-xl p-2 text-xs font-bold transition cursor-pointer border ${
                        checked
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      <span>{mod.label}</span>
                      {checked ? <Check size={14} className="text-emerald-700" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="activeStatus"
              checked={active}
              onChange={e => setActive(e.target.checked)}
              className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="activeStatus" className="text-xs font-bold text-gray-800">
              Active Member on Store Duty
            </label>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-black text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#173d2e] px-4 py-2 text-xs font-black text-white hover:bg-[#123125] transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: PAY MONTHLY SALARY MODAL
// ============================================================
function PaySalaryModal({
  staff,
  defaultMonth,
  onClose,
  onSuccess,
  flash
}: {
  staff: ShopStaffMember;
  defaultMonth: string;
  onClose: () => void;
  onSuccess: (payment: StaffSalaryPayment, staffObj: ShopStaffMember) => void;
  flash: (msg: string) => void;
}) {
  const [month, setMonth] = useState(defaultMonth);
  const [baseAmount, setBaseAmount] = useState(staff.salaryStructure?.monthlyBase || 15000);
  const [bonusAmount, setBonusAmount] = useState(0);
  const [allowances, setAllowances] = useState(staff.salaryStructure?.allowances || 0);

  // Incentive & Attendance Variables
  const [workingDays, setWorkingDays] = useState(30);
  const [presentDays, setPresentDays] = useState(staff.attendanceThisMonth?.present || 26);
  const [halfDays, setHalfDays] = useState(staff.attendanceThisMonth?.halfDay || 0);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [overtimeAmount, setOvertimeAmount] = useState(0);
  const [deliveryCount, setDeliveryCount] = useState(staff.performance?.ordersHandled || 0);
  const [commissionAmount, setCommissionAmount] = useState(staff.performance?.commissionEarned || 0);
  const [tipAmount, setTipAmount] = useState(staff.performance?.tipsEarned || 0);

  // Auto-fill advance deduction if staff has outstanding advances
  const maxAdvance = staff.totalAdvanceOutstanding || 0;
  const [advanceDeduction, setAdvanceDeduction] = useState(maxAdvance > 0 ? maxAdvance : 0);
  const [otherDeductions, setOtherDeductions] = useState(staff.salaryStructure?.deductions || 0);

  const [paymentMode, setPaymentMode] = useState<'UPI' | 'CASH' | 'BANK_TRANSFER'>(
    staff.salaryStructure?.paymentMethod || 'UPI'
  );
  const [referenceNumber, setReferenceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto-calculate overtime pay when hours change
  const handleOvertimeChange = (hrs: number) => {
    setOvertimeHours(hrs);
    const rate = staff.salaryStructure?.overtimeHourlyRate || 100;
    setOvertimeAmount(hrs * rate);
  };

  // Auto-calculate commission when delivery count changes
  const handleDeliveryChange = (count: number) => {
    setDeliveryCount(count);
    const commRate = staff.salaryStructure?.commissionPerDelivery || 25;
    setCommissionAmount(count * commRate);
  };

  // Computed net payout
  const netPaid = Math.max(
    0,
    baseAmount + bonusAmount + allowances + overtimeAmount + commissionAmount + tipAmount - advanceDeduction - otherDeductions
  );

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await recordStaffSalaryPayment(staff.id, {
        month,
        baseAmount,
        bonusAmount,
        allowances,
        advanceDeduction,
        otherDeductions,
        workingDays,
        presentDays,
        halfDays,
        overtimeHours,
        overtimeAmount,
        deliveryCount,
        commissionAmount,
        tipAmount,
        netPaid,
        paymentMode,
        referenceNumber: referenceNumber || `${paymentMode}-${Date.now().toString().slice(-6)}`,
        status: 'PAID',
        notes
      });

      if (res.success && res.payment) {
        onSuccess(res.payment, staff);
      }
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed to record salary payout');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
              <Receipt size={20} />
            </div>
            <div>
              <h3 className="text-lg font-black text-[#173d2e]">Pay Salary: {staff.name}</h3>
              <p className="text-xs text-gray-500">{staff.designation} • {staff.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handlePay} className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200">
            <label className="text-xs font-bold text-gray-700">Salary Month</label>
            <input
              type="month"
              required
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-800"
            />
          </div>

          {/* Attendance snapshot */}
          <div className="rounded-2xl bg-gray-50 p-3 border border-gray-200 space-y-2">
            <span className="text-[11px] font-black uppercase text-gray-600">Attendance This Month</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-500">Working Days</label>
                <input
                  type="number"
                  min="1"
                  value={workingDays}
                  onChange={e => setWorkingDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-2 py-1 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500">Present Days</label>
                <input
                  type="number"
                  min="0"
                  value={presentDays}
                  onChange={e => setPresentDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-2 py-1 text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-500">Half-Days</label>
                <input
                  type="number"
                  min="0"
                  value={halfDays}
                  onChange={e => setHalfDays(Number(e.target.value))}
                  className="w-full rounded-xl border border-gray-300 bg-white px-2 py-1 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Base Pay (₹)</label>
              <input
                type="number"
                min="0"
                required
                value={baseAmount}
                onChange={e => setBaseAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Allowances (₹)</label>
              <input
                type="number"
                min="0"
                value={allowances}
                onChange={e => setAllowances(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Performance Bonus (₹)</label>
              <input
                type="number"
                min="0"
                value={bonusAmount}
                onChange={e => setBonusAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Other Deductions (₹)</label>
              <input
                type="number"
                min="0"
                value={otherDeductions}
                onChange={e => setOtherDeductions(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold"
              />
            </div>
          </div>

          {/* Incentives: Overtime, Delivery Commission, Customer Tips */}
          <div className="rounded-2xl bg-emerald-50/70 p-3.5 border border-emerald-200 space-y-2.5">
            <span className="text-xs font-black uppercase text-emerald-950">Incentives & Variable Pay</span>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-gray-600">OT Hours</label>
                <input
                  type="number"
                  min="0"
                  value={overtimeHours}
                  onChange={e => handleOvertimeChange(Number(e.target.value))}
                  className="w-full rounded-xl border border-emerald-200 bg-white px-2 py-1 text-xs font-bold"
                />
                <span className="text-[10px] text-emerald-800 font-bold">+₹{overtimeAmount}</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600">Deliveries</label>
                <input
                  type="number"
                  min="0"
                  value={deliveryCount}
                  onChange={e => handleDeliveryChange(Number(e.target.value))}
                  className="w-full rounded-xl border border-emerald-200 bg-white px-2 py-1 text-xs font-bold"
                />
                <span className="text-[10px] text-emerald-800 font-bold">+₹{commissionAmount}</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-600">Tips (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={tipAmount}
                  onChange={e => setTipAmount(Number(e.target.value))}
                  className="w-full rounded-xl border border-emerald-200 bg-white px-2 py-1 text-xs font-bold"
                />
                <span className="text-[10px] text-emerald-800 font-bold">+₹{tipAmount}</span>
              </div>
            </div>
          </div>

          {/* Advance Deduction Toggle/Input */}
          {maxAdvance > 0 && (
            <div className="rounded-2xl bg-amber-50 p-3.5 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-amber-900">
                <span>Outstanding Advance on Record:</span>
                <span>₹{maxAdvance.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className="text-[11px] font-bold text-amber-800">Deduct from this month's pay (₹):</label>
                <input
                  type="number"
                  min="0"
                  max={maxAdvance}
                  value={advanceDeduction}
                  onChange={e => setAdvanceDeduction(Number(e.target.value))}
                  className="w-28 rounded-xl border border-amber-300 bg-white px-2.5 py-1 text-xs font-black text-amber-900"
                />
              </div>
            </div>
          )}

          {/* Net Amount Card */}
          <div className="rounded-2xl bg-emerald-800 p-4 text-white flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">Net Amount to Disburse</p>
              <p className="text-2xl font-black mt-0.5">₹{netPaid.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right text-[11px] text-emerald-200">
              <p>Base + Allow + Bonus</p>
              <p>- Advances & Deductions</p>
            </div>
          </div>

          {/* Payment Mode & Reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Payment Mode</label>
              <select
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value as any)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold"
              >
                <option value="UPI">UPI Transfer</option>
                <option value="CASH">Cash in Hand</option>
                <option value="BANK_TRANSFER">Direct Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Ref / UTR / Voucher No</label>
              <input
                type="text"
                placeholder="e.g. UPI-99214 or Voucher-09"
                value={referenceNumber}
                onChange={e => setReferenceNumber(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Notes / Remarks</label>
            <input
              type="text"
              placeholder="e.g. Cleared full salary on time, full attendance"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-black text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#173d2e] px-5 py-2 text-xs font-black text-white hover:bg-[#123125] transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Disburse & Print Slip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: ISSUE ADVANCE MODAL
// ============================================================
function IssueAdvanceModal({
  staff,
  staffList,
  onClose,
  onSuccess,
  flash
}: {
  staff: ShopStaffMember;
  staffList: ShopStaffMember[];
  onClose: () => void;
  onSuccess: (adv: StaffAdvance) => void;
  flash: (msg: string) => void;
}) {
  const [selectedStaffId, setSelectedStaffId] = useState(staff.id);
  const [amount, setAmount] = useState(2000);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('Emergency expense advance');
  const [submitting, setSubmitting] = useState(false);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return flash('Amount must be greater than 0');

    setSubmitting(true);
    try {
      const res = await issueStaffSalaryAdvance(selectedStaffId, {
        amount,
        reason,
        date
      });
      if (res.success && res.advance) {
        onSuccess(res.advance);
      }
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed to issue advance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="text-amber-600" size={20} />
            <h3 className="text-lg font-black text-[#173d2e]">Issue Salary Advance</h3>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleIssue} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Staff Member</label>
            <select
              value={selectedStaffId}
              onChange={e => setSelectedStaffId(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold"
            >
              {staffList.filter(s => s.active).map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.designation})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Advance Amount (₹) *</label>
            <input
              type="number"
              min="100"
              required
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm font-black text-[#173d2e]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Date Issued</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Reason / Notes</label>
            <input
              type="text"
              placeholder="e.g. Festival advance, Bike fuel, Medical emergency"
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-xs font-bold"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-black text-gray-600 hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-black text-white hover:bg-amber-700 transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Grant Advance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: SALARY SLIP / PAYMENT VOUCHER MODAL
// ============================================================
function SalarySlipModal({
  payment,
  staff,
  shopName,
  shopAddress,
  onClose
}: {
  payment: StaffSalaryPayment;
  staff: ShopStaffMember;
  shopName: string;
  shopAddress: string;
  onClose: () => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <Printer size={18} className="text-emerald-700" />
            <span className="text-sm font-black text-[#173d2e]">Official Salary Voucher</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-800 transition cursor-pointer"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button onClick={onClose} className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 cursor-pointer">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Voucher Paper */}
        <div className="mt-4 rounded-2xl border-2 border-gray-200 p-6 bg-white font-sans text-gray-800">
          {/* Header */}
          <div className="border-b-2 border-gray-800 pb-4 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wider text-[#173d2e]">{shopName}</h2>
              <p className="text-xs text-gray-600">{shopAddress}</p>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">FreshCart Network Verified Merchant</p>
            </div>
            <div className="text-right">
              <span className="rounded-md bg-emerald-800 px-2.5 py-1 text-[11px] font-black uppercase text-white tracking-widest">
                Salary Slip
              </span>
              <p className="text-xs font-bold mt-2 text-gray-700">Month: <b>{payment.month}</b></p>
              <p className="text-[11px] text-gray-500 font-mono">Date: {payment.paymentDate}</p>
            </div>
          </div>

          {/* Employee Info */}
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs border-b border-gray-200 pb-4">
            <div>
              <p className="text-gray-400 text-[10px] uppercase font-bold">Employee Name</p>
              <p className="font-black text-sm text-[#173d2e]">{staff.name}</p>
              <p className="text-gray-600">{staff.designation}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-400 text-[10px] uppercase font-bold">Staff ID & Contact</p>
              <p className="font-mono font-bold text-gray-700">{staff.id}</p>
              <p className="font-mono text-gray-600">{staff.phone}</p>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="mt-4 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="font-bold text-gray-600">Base Monthly Salary:</span>
              <span className="font-black font-mono">₹{payment.baseAmount.toLocaleString('en-IN')}</span>
            </div>

            {payment.allowances > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-100 text-emerald-800">
                <span className="font-bold">Allowances (Food/Travel):</span>
                <span className="font-black font-mono">+₹{payment.allowances.toLocaleString('en-IN')}</span>
              </div>
            )}

            {payment.bonusAmount > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-100 text-emerald-800">
                <span className="font-bold">Performance Bonus:</span>
                <span className="font-black font-mono">+₹{payment.bonusAmount.toLocaleString('en-IN')}</span>
              </div>
            )}

            {payment.overtimeAmount && payment.overtimeAmount > 0 ? (
              <div className="flex justify-between py-1 border-b border-gray-100 text-emerald-800">
                <span className="font-bold">Overtime Pay ({payment.overtimeHours || 0} hrs):</span>
                <span className="font-black font-mono">+₹{payment.overtimeAmount.toLocaleString('en-IN')}</span>
              </div>
            ) : null}

            {payment.commissionAmount && payment.commissionAmount > 0 ? (
              <div className="flex justify-between py-1 border-b border-gray-100 text-emerald-800">
                <span className="font-bold">Delivery Commission ({payment.deliveryCount || 0} orders):</span>
                <span className="font-black font-mono">+₹{payment.commissionAmount.toLocaleString('en-IN')}</span>
              </div>
            ) : null}

            {payment.tipAmount && payment.tipAmount > 0 ? (
              <div className="flex justify-between py-1 border-b border-gray-100 text-emerald-800">
                <span className="font-bold">Customer Tips Collected:</span>
                <span className="font-black font-mono">+₹{payment.tipAmount.toLocaleString('en-IN')}</span>
              </div>
            ) : null}

            {payment.advanceDeduction > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-100 text-rose-700">
                <span className="font-bold">Advance Recovery Deducted:</span>
                <span className="font-black font-mono">-₹{payment.advanceDeduction.toLocaleString('en-IN')}</span>
              </div>
            )}

            {payment.otherDeductions > 0 && (
              <div className="flex justify-between py-1 border-b border-gray-100 text-rose-700">
                <span className="font-bold">Other Deductions:</span>
                <span className="font-black font-mono">-₹{payment.otherDeductions.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="mt-3 pt-3 border-t-2 border-gray-800 flex justify-between items-center text-sm font-black text-[#173d2e]">
              <span>TOTAL NET PAYOUT DISBURSED:</span>
              <span className="text-lg font-mono">₹{payment.netPaid.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Payment Mode & Reference */}
          <div className="mt-4 rounded-xl bg-gray-50 p-3 text-[11px] font-mono text-gray-700 border border-gray-200">
            <p><b>Payment Mode:</b> {payment.paymentMode}</p>
            <p><b>Transaction Ref:</b> {payment.referenceNumber || 'N/A'}</p>
            {payment.notes && <p><b>Remarks:</b> {payment.notes}</p>}
          </div>

          {/* Signatures */}
          <div className="mt-8 pt-4 grid grid-cols-2 gap-8 text-center text-xs text-gray-500">
            <div className="border-t border-gray-300 pt-2">
              <p className="font-bold text-gray-700">Employee Signature / Acknowledgment</p>
            </div>
            <div className="border-t border-gray-300 pt-2">
              <p className="font-bold text-gray-700">Authorized Storekeeper Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENT: STAFF SALARY & ADVANCE HISTORY MODAL
// ============================================================
function StaffHistoryModal({
  staff,
  history,
  onClose,
  onViewSlip
}: {
  staff: ShopStaffMember;
  history: { payments: StaffSalaryPayment[]; advances: StaffAdvance[] };
  onClose: () => void;
  onViewSlip: (payment: StaffSalaryPayment) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-lg font-black text-[#173d2e]">Payroll & Advance History: {staff.name}</h3>
            <p className="text-xs text-gray-500">{staff.designation} • {staff.phone}</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-100 cursor-pointer">
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {/* Salary Payments */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-900 mb-2">
              Salary Payment Slips ({history.payments.length})
            </h4>
            <div className="space-y-2">
              {history.payments.map(p => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-gray-50 p-3 border border-gray-200">
                  <div>
                    <span className="font-black text-xs text-[#173d2e]">Month: {p.month}</span>
                    <p className="text-[11px] text-gray-500">
                      Paid: ₹{p.netPaid} via {p.paymentMode} on {p.paymentDate}
                    </p>
                  </div>
                  <button
                    onClick={() => onViewSlip(p)}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-black text-emerald-800 border border-gray-200 hover:bg-emerald-50 transition cursor-pointer"
                  >
                    <Printer size={13} />
                    <span>View Slip</span>
                  </button>
                </div>
              ))}
              {!history.payments.length && (
                <p className="text-xs text-gray-400 italic py-2">No past salary records found for this staff member.</p>
              )}
            </div>
          </div>

          {/* Advances */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 mb-2">
              Advance & Loan Records ({history.advances.length})
            </h4>
            <div className="space-y-2">
              {history.advances.map(a => (
                <div key={a.id} className="flex items-center justify-between rounded-xl bg-amber-50/50 p-3 border border-amber-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-[#173d2e]">₹{a.amount}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                          a.settled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {a.settled ? 'Settled' : 'Pending Recovery'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-600">{a.reason} • Issued on {a.date}</p>
                  </div>
                </div>
              ))}
              {!history.advances.length && (
                <p className="text-xs text-gray-400 italic py-2">No advances issued to this staff member.</p>
              )}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 text-right">
          <button
            onClick={onClose}
            className="rounded-xl bg-[#173d2e] px-4 py-2 text-xs font-black text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
