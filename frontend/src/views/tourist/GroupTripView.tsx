import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  DollarSign, 
  Plus, 
  CheckCircle2, 
  Share2, 
  ArrowRight, 
  Split, 
  Hotel, 
  Utensils, 
  Navigation,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function GroupTripView() {
  const { groupExpenses, addGroupExpense } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');
  const [payer, setPayer] = useState('Aarav (You)');
  const [settledToast, setSettledToast] = useState(false);

  const companions = ['Aarav (You)', 'Priya Sharma', 'Rohan Verma'];

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!desc || !amount) return;
    addGroupExpense({
      description: desc,
      amount: parseFloat(amount),
      category,
      payer,
      splitWith: companions
    });
    setDesc('');
    setAmount('');
    setModalOpen(false);
  };

  const totalTripExpenses = groupExpenses.reduce((sum, item) => sum + item.amount, 0);
  const perPersonShare = Math.round(totalTripExpenses / companions.length);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-border dark:border-darkmode-border">
        <div>
          <div className="flex items-center gap-2 text-brand font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Group Travel Mode & Split-UPI</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
            Companions & Shared Expenses
          </h1>
          <p className="text-xs sm:text-sm text-neutral-text-sec dark:text-darkmode-text-secondary mt-1">
            Coordinate activities, vote on stops, and automatically calculate who owes whom without awkward math.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="btn-action !text-xs font-bold flex items-center gap-1.5 shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Group Expense</span>
        </button>
      </div>

      {settledToast && (
        <div className="p-3 bg-nature-light text-nature border border-nature/30 rounded-ts-md text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Settlement link dispatched via instant UPI request.</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="ts-card p-5 space-y-1">
          <span className="text-neutral-muted block font-semibold">Total Shared Expenses</span>
          <p className="text-2xl font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
            ₹{totalTripExpenses.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-neutral-muted">Across {groupExpenses.length} logged items</p>
        </div>

        <div className="ts-card p-5 space-y-1">
          <span className="text-neutral-muted block font-semibold">Equally Split Per Person</span>
          <p className="text-2xl font-extrabold text-brand">
            ₹{perPersonShare.toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-neutral-muted">Divided among {companions.length} companions</p>
        </div>

        <div className="ts-card p-5 space-y-1 bg-nature-light/30 border-nature/30">
          <span className="text-neutral-muted block font-semibold">Your Balance Status</span>
          <p className="text-2xl font-extrabold text-nature">
            +₹3,600
          </p>
          <p className="text-[11px] text-nature font-bold">You are owed money by Rohan & Priya</p>
        </div>
      </div>

      {/* "Who Owes Whom" Settlement Ledger (Section 53) */}
      <div className="ts-card p-6 space-y-4">
        <h3 className="text-base font-bold text-neutral-text-primary dark:text-darkmode-text-primary flex items-center gap-2">
          <Split className="w-4 h-4 text-brand" />
          <span>Who Owes Whom (Automated Settlement Matrix)</span>
        </h3>

        <div className="space-y-3 text-xs">
          <div className="p-3.5 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-semantic-warning"></span>
              <span className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                Rohan Verma owes you:
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-sm text-neutral-text-primary dark:text-darkmode-text-primary">₹2,050</span>
              <button
                onClick={() => { setSettledToast(true); setTimeout(() => setSettledToast(false), 3000); }}
                className="btn-brand !px-2.5 !py-1 !text-[11px] font-bold"
              >
                Send UPI Settle Ping
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-ts-md bg-neutral-bg-secondary dark:bg-darkmode-elevated flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-semantic-warning"></span>
              <span className="font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
                Priya Sharma owes you:
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-extrabold text-sm text-neutral-text-primary dark:text-darkmode-text-primary">₹1,550</span>
              <button
                onClick={() => { setSettledToast(true); setTimeout(() => setSettledToast(false), 3000); }}
                className="btn-brand !px-2.5 !py-1 !text-[11px] font-bold"
              >
                Send UPI Settle Ping
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Expense History List */}
      <div className="ts-card p-6 space-y-4">
        <h3 className="text-base font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
          Logged Group Expenses
        </h3>

        <div className="space-y-2.5 text-xs">
          {groupExpenses.map((exp) => (
            <div
              key={exp.id}
              className="p-3.5 rounded-ts-md border border-neutral-border dark:border-darkmode-border flex items-center justify-between"
            >
              <div className="space-y-0.5">
                <p className="font-bold text-sm text-neutral-text-primary dark:text-darkmode-text-primary">
                  {exp.description}
                </p>
                <p className="text-neutral-muted">
                  Paid by <strong className="text-neutral-text-primary dark:text-darkmode-text-primary">{exp.payer}</strong> • Category: {exp.category}
                </p>
              </div>

              <div className="text-right">
                <span className="text-base font-extrabold text-neutral-text-primary dark:text-darkmode-text-primary">
                  ₹{exp.amount.toLocaleString('en-IN')}
                </span>
                <p className="text-[11px] text-neutral-muted">
                  Split 3 ways (~₹{Math.round(exp.amount / 3)} each)
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-neutral-card dark:bg-darkmode-surface border border-neutral-border rounded-ts-hero p-6 space-y-4">
            <h3 className="text-base font-bold text-neutral-text-primary dark:text-darkmode-text-primary">
              Log Shared Expense
            </h3>

            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="font-bold block mb-1">Expense Description</label>
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="e.g. Village lunch, Jeep fare, Homestay dinner"
                  className="w-full p-2.5 rounded bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border font-semibold outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="1200"
                    className="w-full p-2.5 rounded bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border font-bold outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 rounded bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border font-semibold"
                  >
                    <option value="Food">Food & Meals</option>
                    <option value="Stay">Stay & Homestay</option>
                    <option value="Transport">Transport & Jeep</option>
                    <option value="Activity">Guide & Activity</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Who Paid?</label>
                <select
                  value={payer}
                  onChange={(e) => setPayer(e.target.value)}
                  className="w-full p-2.5 rounded bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border font-semibold"
                >
                  {companions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">Split Type</label>
                  <select
                    className="w-full p-2.5 rounded bg-neutral-bg dark:bg-darkmode-elevated border border-neutral-border font-semibold text-xs"
                  >
                    <option value="equal">Equal Split (1/3)</option>
                    <option value="custom">Custom Allocation</option>
                    <option value="shares">Weighted Shares</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">Receipt Attachment</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={() => alert("Receipt attached and verified for trip audit.")}
                    className="w-full text-[11px] file:mr-2 file:py-1.5 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary-800 file:text-primary-50 hover:file:bg-primary-900 cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button type="submit" className="btn-action flex-1 py-2.5 text-xs font-bold">
                  Add to Group Split
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary py-2.5 px-4 text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
