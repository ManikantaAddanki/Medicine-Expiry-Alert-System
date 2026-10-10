import React, { useState } from 'react';
import { Database, Code2, Layers, Cpu, Server, FileText, CheckCircle2 } from 'lucide-react';

export const ArchitectureExplorerView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schema' | 'sqlalchemy' | 'fastapi' | 'fefo_math' | 'roadmap'>('schema');

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">System Architecture & Database Inspector</h2>
          <span className="text-[10px] font-mono bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded">
            B.Tech Final-Year Technical Dossier
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Complete engineering specifications: MySQL 8.0 InnoDB schema, SQLAlchemy 2.0 ORM, FastAPI REST contracts, and FEFO mathematical proofs
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('schema')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'schema' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>MySQL 8.0 DDL & Schema</span>
        </button>
        <button
          onClick={() => setActiveTab('sqlalchemy')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'sqlalchemy' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>SQLAlchemy ORM Models</span>
        </button>
        <button
          onClick={() => setActiveTab('fastapi')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'fastapi' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>FastAPI REST Endpoints</span>
        </button>
        <button
          onClick={() => setActiveTab('fefo_math')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'fefo_math' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>FEFO Algorithm & Logic</span>
        </button>
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`px-3 py-1.5 font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'roadmap' ? 'bg-slate-900 text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Phase Roadmap & Tests</span>
        </button>
      </div>

      {/* Tab 1: MySQL Schema */}
      {activeTab === 'schema' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Normalized MySQL 8.0 InnoDB Architecture</h3>
            <p className="text-slate-500">
              The database utilizes MySQL 8.0 with InnoDB storage engine for ACID transaction compliance, foreign key cascade constraints, and row-level locking.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-800">1. `medicines` (Formulation Master)</span>
              <p className="text-[11px] text-slate-600 mt-1">
                Stores catalog SKUs independent of physical batches: <code>id</code>, <code>name</code>, <code>generic_name</code>, <code>category_id</code>, <code>dosage_form</code>, <code>strength</code>, <code>minimum_reorder_level</code>.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-800">2. `medicine_batches` (Batch Inventory)</span>
              <p className="text-[11px] text-slate-600 mt-1">
                Granular physical tracking: <code>id</code>, <code>medicine_id</code>, <code>batch_number</code>, <code>manufacturing_date</code>, <code>expiry_date</code>, <code>available_quantity</code>, <code>status (ACTIVE, QUARANTINED, EXPIRED)</code>.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-800">3. `expiry_alerts` (Surveillance Alerts)</span>
              <p className="text-[11px] text-slate-600 mt-1">
                Materialized risk records generated by APScheduler: <code>severity</code>, <code>days_remaining</code>, <code>units_affected</code>, <code>estimated_value_at_risk</code>.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="font-bold text-slate-800">4. `stock_transactions` (Audit Ledger)</span>
              <p className="text-[11px] text-slate-600 mt-1">
                Append-only financial and clinical ledger: <code>transaction_type</code> (RECEIVE, DISPENSE, QUARANTINE, ADJUSTMENT, RETURN), <code>quantity_change</code>, <code>resulting_quantity</code>.
              </p>
            </div>
          </div>

          <div className="mt-4">
            <span className="font-bold text-slate-800 block mb-2">Production MySQL DDL Definition:</span>
            <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto leading-relaxed">
{`CREATE DATABASE medicine_expiry_db 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE medicine_expiry_db;

CREATE TABLE medicine_batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    medicine_id INT NOT NULL,
    branch_id INT NOT NULL,
    supplier_id INT NULL,
    batch_number VARCHAR(80) NOT NULL,
    manufacturing_date DATE NULL,
    expiry_date DATE NOT NULL,
    quantity_received INT NOT NULL,
    available_quantity INT NOT NULL,
    purchase_price DECIMAL(10, 2) NOT NULL,
    selling_price DECIMAL(10, 2) NOT NULL,
    storage_location VARCHAR(80) NULL,
    status ENUM('ACTIVE', 'QUARANTINED', 'RECALLED', 'EXPIRED', 'DEPLETED') DEFAULT 'ACTIVE',
    quarantine_reason TEXT NULL,
    received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_batch_branch_med (batch_number, branch_id, medicine_id),
    INDEX idx_batch_expiry (expiry_date, status),
    CONSTRAINT fk_batch_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT
) ENGINE=InnoDB;`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 2: SQLAlchemy Models */}
      {activeTab === 'sqlalchemy' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">SQLAlchemy 2.0 ORM Declarative Code</h3>
            <p className="text-slate-500">
              Clean separation of domain models located in <code>medicine-expiry-alert/app/models/inventory.py</code>.
            </p>
          </div>

          <pre className="p-3 bg-slate-950 text-teal-300 font-mono text-[11px] rounded-lg overflow-x-auto leading-relaxed">
{`from sqlalchemy import Column, Integer, String, Date, Numeric, Enum as SQLEnum, ForeignKey
from app.database.session import Base
from app.core.enums import BatchStatus

class MedicineBatch(Base):
    __tablename__ = "medicine_batches"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id"), nullable=False)
    batch_number = Column(String(80), nullable=False)
    expiry_date = Column(Date, nullable=False, index=True)
    available_quantity = Column(Integer, nullable=False)
    purchase_price = Column(Numeric(10, 2), nullable=False)
    status = Column(SQLEnum(BatchStatus), default=BatchStatus.ACTIVE, nullable=False)
    quarantine_reason = Column(String(255), nullable=True)

    # Relationships
    medicine = relationship("Medicine", back_populates="batches")
    transactions = relationship("StockTransaction", back_populates="batch")`}
          </pre>
        </div>
      )}

      {/* Tab 3: FastAPI Endpoints */}
      {activeTab === 'fastapi' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">REST API Contract & Schema</h3>
            <p className="text-slate-500">
              Standardized HTTP routes exposed in <code>medicine-expiry-alert/app/api/v1/</code> with Pydantic v2 payload validation.
            </p>
          </div>

          <div className="space-y-2">
            {[
              { method: 'GET', path: '/api/v1/medicines', desc: 'Query formulations with search and category filtering' },
              { method: 'POST', path: '/api/v1/medicines', desc: 'Create new medicine SKU in catalog' },
              { method: 'GET', path: '/api/v1/batches', desc: 'List batches with days-remaining and quarantine status' },
              { method: 'POST', path: '/api/v1/batches', desc: 'Receive new physical batch shipment' },
              { method: 'GET', path: '/api/v1/alerts/summary', desc: 'KPI counters and aggregated capital value at risk' },
              { method: 'POST', path: '/api/v1/alerts/run-check', desc: 'Trigger manual background scheduler scan' },
              { method: 'POST', path: '/api/v1/inventory/fefo-recommendation', desc: 'Calculate greedy FEFO picking allocations' },
              { method: 'POST', path: '/api/v1/inventory/transactions', desc: 'Commit atomic stock movements to ledger' },
            ].map((ep, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2 font-mono">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    ep.method === 'GET' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {ep.method}
                  </span>
                  <span className="font-semibold text-slate-900">{ep.path}</span>
                </div>
                <span className="text-slate-500 text-[11px]">{ep.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: FEFO Math & Algorithm */}
      {activeTab === 'fefo_math' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">FEFO Mathematical Model & Safety Invariants</h3>
            <p className="text-slate-500">
              Formal algorithm preventing dispensing of degraded stock while minimizing financial expiration loss.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 font-mono text-[11px]">
            <div className="font-bold text-slate-800">Algorithm: Greedy FEFO Allocation</div>
            <div className="text-slate-700 space-y-1">
              <div>1. Given Medicine M, Requested Units Q_req, Reference Date D_ref.</div>
              <div>2. Filter Batches B = {'{'}b in M | b.status == ACTIVE and b.expiry_date &gt; D_ref and b.quantity &gt; 0{'}'}.</div>
              <div>3. Sort B ascending by b.expiry_date.</div>
              <div>4. Initialize Q_remaining = Q_req, Allocations = [].</div>
              <div>5. For each batch b in B:</div>
              <div className="pl-4">k = min(b.available_quantity, Q_remaining)</div>
              <div className="pl-4">Allocations.append({'{'}batch: b.id, units: k{'}'})</div>
              <div className="pl-4">Q_remaining = Q_remaining - k</div>
              <div className="pl-4">If Q_remaining == 0: break</div>
              <div>6. Return Allocations, Fulfilled = (Q_remaining == 0).</div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
            <strong>Safety Invariant Proven:</strong> Batches with expiry_date &le; D_ref or status == QUARANTINED have a selection probability of strictly 0.
          </div>
        </div>
      )}

      {/* Tab 5: Roadmap & Tests */}
      {activeTab === 'roadmap' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">Pytest Unit Test Suite Execution</h3>
            <p className="text-slate-500">
              Verified with 5 automated unit tests in <code>tests/test_expiry_fefo.py</code>:
            </p>
          </div>

          <div className="space-y-2">
            {[
              { name: 'test_days_remaining_calculation', status: 'PASSED', desc: 'Validates -1d (yesterday), 0d (today boundary), +7d' },
              { name: 'test_exact_expiry_threshold_boundaries', status: 'PASSED', desc: 'Validates <=0d Expired, 1-7d Critical, 8-30d High, 31-60d Warning, 61-90d Upcoming' },
              { name: 'test_value_at_risk_calculation', status: 'PASSED', desc: 'Validates exact unit quantity x cost price dollar exposure' },
              { name: 'test_fefo_allocation_earliest_first', status: 'PASSED', desc: 'Validates greedy consumption from earlier expiry batch before newer batch' },
              { name: 'test_fefo_excludes_quarantined_and_expired', status: 'PASSED', desc: 'Validates zero-allocation safety bypass for expired & quarantined batches' },
            ].map((t, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-mono font-bold text-slate-900">{t.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">{t.desc}</span>
                  <span className="font-mono font-bold text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
