import { Machine, Job, Alert, FactoryStore } from './serverApi';
import { runScheduler } from './serverScheduler';

export function generateDemoDataset(): FactoryStore {
  const machines: Machine[] = [
    { id: 1, machine_code: 'M01', machine_name: 'CNC Cutting Machine', machine_type: 'Cutting', status: 'AVAILABLE', capacity: 1, location: 'Bay 1 - Cutting Cell', maintenance_status: 'Nominal - Operational', created_at: '2026-03-01T08:00:00Z' },
    { id: 2, machine_code: 'M02', machine_name: 'CNC Milling Machine', machine_type: 'Milling', status: 'BUSY', capacity: 1, location: 'Bay 1 - Milling Cell', maintenance_status: 'Active Production - High Demand', created_at: '2026-03-01T08:00:00Z' },
    { id: 3, machine_code: 'M03', machine_name: 'Drilling Machine', machine_type: 'Drilling', status: 'AVAILABLE', capacity: 1, location: 'Bay 2 - Precision Hole Bay', maintenance_status: 'Nominal - Tooling Pre-set', created_at: '2026-03-01T08:00:00Z' },
    { id: 4, machine_code: 'M04', machine_name: 'Welding Station', machine_type: 'Welding', status: 'AVAILABLE', capacity: 1, location: 'Bay 2 - Arc Welding Station', maintenance_status: 'Nominal - Gas Line Nominal', created_at: '2026-03-01T08:00:00Z' },
    { id: 5, machine_code: 'M05', machine_name: 'Painting Station', machine_type: 'Finishing', status: 'MAINTENANCE', capacity: 1, location: 'Bay 3 - Spray Booth', maintenance_status: 'Scheduled Maintenance: Filter Replacement & Recalibration (08:00-12:00)', created_at: '2026-03-01T08:00:00Z' },
    { id: 6, machine_code: 'M06', machine_name: 'Assembly Station', machine_type: 'Assembly', status: 'AVAILABLE', capacity: 1, location: 'Bay 4 - Integration Bay', maintenance_status: 'Nominal - Ready for Final QA', created_at: '2026-03-01T08:00:00Z' },
  ];

  const jobs: Job[] = [
    {
      id: 1,
      job_number: 'JOB-001',
      customer_name: 'Apex Precision Aerospace',
      product_name: 'Structural Titanium Bracket',
      quantity: 12,
      priority: 'URGENT',
      due_date: '2026-03-22T16:00:00Z',
      status: 'RUNNING',
      estimated_processing_time: 6.5,
      created_at: '2026-03-20T08:00:00Z',
      operations: [
        {
          id: 101,
          job_id: 1,
          operation_number: 'OP-10',
          operation_name: 'Cutting',
          processing_time: 1.5,
          sequence_number: 1,
          priority: 'URGENT',
          status: 'COMPLETED',
          eligible_machines: [
            { machine_id: 1, processing_time: 1.5, is_preferred: true, machine_code: 'M01', machine_name: 'CNC Cutting Machine' },
            { machine_id: 2, processing_time: 2.0, is_preferred: false, machine_code: 'M02', machine_name: 'CNC Milling Machine' }
          ]
        },
        {
          id: 102,
          job_id: 1,
          operation_number: 'OP-20',
          operation_name: 'Milling',
          processing_time: 2.0,
          sequence_number: 2,
          priority: 'URGENT',
          status: 'PROCESSING',
          eligible_machines: [
            { machine_id: 2, processing_time: 2.0, is_preferred: true, machine_code: 'M02', machine_name: 'CNC Milling Machine' },
            { machine_id: 3, processing_time: 2.5, is_preferred: false, machine_code: 'M03', machine_name: 'Drilling Machine' }
          ]
        },
        {
          id: 103,
          job_id: 1,
          operation_number: 'OP-30',
          operation_name: 'Drilling',
          processing_time: 1.2,
          sequence_number: 3,
          priority: 'URGENT',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 3, processing_time: 1.2, is_preferred: true, machine_code: 'M03', machine_name: 'Drilling Machine' },
            { machine_id: 1, processing_time: 1.8, is_preferred: false, machine_code: 'M01', machine_name: 'CNC Cutting Machine' }
          ]
        },
        {
          id: 104,
          job_id: 1,
          operation_number: 'OP-40',
          operation_name: 'Assembly',
          processing_time: 1.8,
          sequence_number: 4,
          priority: 'URGENT',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 6, processing_time: 1.8, is_preferred: true, machine_code: 'M06', machine_name: 'Assembly Station' },
            { machine_id: 4, processing_time: 2.2, is_preferred: false, machine_code: 'M04', machine_name: 'Welding Station' }
          ]
        }
      ]
    },
    {
      id: 2,
      job_number: 'JOB-002',
      customer_name: 'RoboMotion Systems',
      product_name: 'Articulated Arm Joint Casing',
      quantity: 25,
      priority: 'HIGH',
      due_date: '2026-03-23T12:00:00Z',
      status: 'SCHEDULED',
      estimated_processing_time: 7.5,
      created_at: '2026-03-20T08:30:00Z',
      operations: [
        {
          id: 105,
          job_id: 2,
          operation_number: 'OP-10',
          operation_name: 'Cutting',
          processing_time: 1.8,
          sequence_number: 1,
          priority: 'HIGH',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 1, processing_time: 1.8, is_preferred: true, machine_code: 'M01', machine_name: 'CNC Cutting Machine' },
            { machine_id: 2, processing_time: 2.2, is_preferred: false, machine_code: 'M02', machine_name: 'CNC Milling Machine' }
          ]
        },
        {
          id: 106,
          job_id: 2,
          operation_number: 'OP-20',
          operation_name: 'Welding',
          processing_time: 2.2,
          sequence_number: 2,
          priority: 'HIGH',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 4, processing_time: 2.2, is_preferred: true, machine_code: 'M04', machine_name: 'Welding Station' },
            { machine_id: 6, processing_time: 2.8, is_preferred: false, machine_code: 'M06', machine_name: 'Assembly Station' }
          ]
        },
        {
          id: 107,
          job_id: 2,
          operation_number: 'OP-30',
          operation_name: 'Painting',
          processing_time: 1.5,
          sequence_number: 3,
          priority: 'HIGH',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 5, processing_time: 1.5, is_preferred: true, machine_code: 'M05', machine_name: 'Painting Station' },
            { machine_id: 6, processing_time: 2.0, is_preferred: false, machine_code: 'M06', machine_name: 'Assembly Station' }
          ]
        },
        {
          id: 108,
          job_id: 2,
          operation_number: 'OP-40',
          operation_name: 'Assembly',
          processing_time: 2.0,
          sequence_number: 4,
          priority: 'HIGH',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 6, processing_time: 2.0, is_preferred: true, machine_code: 'M06', machine_name: 'Assembly Station' },
            { machine_id: 4, processing_time: 2.5, is_preferred: false, machine_code: 'M04', machine_name: 'Welding Station' }
          ]
        }
      ]
    },
    {
      id: 3,
      job_number: 'JOB-003',
      customer_name: 'BioTech Implants Inc',
      product_name: 'Knee Joint Prosthetic Stem',
      quantity: 18,
      priority: 'HIGH',
      due_date: '2026-03-24T10:00:00Z',
      status: 'SCHEDULED',
      estimated_processing_time: 7.7,
      created_at: '2026-03-20T09:00:00Z',
      operations: [
        {
          id: 109,
          job_id: 3,
          operation_number: 'OP-10',
          operation_name: 'Milling',
          processing_time: 2.5,
          sequence_number: 1,
          priority: 'HIGH',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 2, processing_time: 2.5, is_preferred: true, machine_code: 'M02', machine_name: 'CNC Milling Machine' },
            { machine_id: 1, processing_time: 3.0, is_preferred: false, machine_code: 'M01', machine_name: 'CNC Cutting Machine' }
          ]
        },
        {
          id: 110,
          job_id: 3,
          operation_number: 'OP-20',
          operation_name: 'Drilling',
          processing_time: 1.4,
          sequence_number: 2,
          priority: 'HIGH',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 3, processing_time: 1.4, is_preferred: true, machine_code: 'M03', machine_name: 'Drilling Machine' },
            { machine_id: 1, processing_time: 2.0, is_preferred: false, machine_code: 'M01', machine_name: 'CNC Cutting Machine' }
          ]
        },
        {
          id: 111,
          job_id: 3,
          operation_number: 'OP-30',
          operation_name: 'Welding',
          processing_time: 1.6,
          sequence_number: 3,
          priority: 'HIGH',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 4, processing_time: 1.6, is_preferred: true, machine_code: 'M04', machine_name: 'Welding Station' },
            { machine_id: 6, processing_time: 2.0, is_preferred: false, machine_code: 'M06', machine_name: 'Assembly Station' }
          ]
        },
        {
          id: 112,
          job_id: 3,
          operation_number: 'OP-40',
          operation_name: 'Assembly',
          processing_time: 2.2,
          sequence_number: 4,
          priority: 'HIGH',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 6, processing_time: 2.2, is_preferred: true, machine_code: 'M06', machine_name: 'Assembly Station' },
            { machine_id: 4, processing_time: 2.8, is_preferred: false, machine_code: 'M04', machine_name: 'Welding Station' }
          ]
        }
      ]
    },
    {
      id: 4,
      job_number: 'JOB-004',
      customer_name: 'VoltWave EV Motors',
      product_name: 'Rotor Core Shaft Extension',
      quantity: 40,
      priority: 'MEDIUM',
      due_date: '2026-03-24T18:00:00Z',
      status: 'SCHEDULED',
      estimated_processing_time: 7.5,
      created_at: '2026-03-20T09:30:00Z',
      operations: [
        {
          id: 113,
          job_id: 4,
          operation_number: 'OP-10',
          operation_name: 'Cutting',
          processing_time: 2.0,
          sequence_number: 1,
          priority: 'MEDIUM',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 1, processing_time: 2.0, is_preferred: true, machine_code: 'M01', machine_name: 'CNC Cutting Machine' },
            { machine_id: 2, processing_time: 2.6, is_preferred: false, machine_code: 'M02', machine_name: 'CNC Milling Machine' }
          ]
        },
        {
          id: 114,
          job_id: 4,
          operation_number: 'OP-20',
          operation_name: 'Milling',
          processing_time: 2.2,
          sequence_number: 2,
          priority: 'MEDIUM',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 2, processing_time: 2.2, is_preferred: true, machine_code: 'M02', machine_name: 'CNC Milling Machine' },
            { machine_id: 3, processing_time: 2.8, is_preferred: false, machine_code: 'M03', machine_name: 'Drilling Machine' }
          ]
        },
        {
          id: 115,
          job_id: 4,
          operation_number: 'OP-30',
          operation_name: 'Welding',
          processing_time: 1.8,
          sequence_number: 3,
          priority: 'MEDIUM',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 4, processing_time: 1.8, is_preferred: true, machine_code: 'M04', machine_name: 'Welding Station' },
            { machine_id: 6, processing_time: 2.4, is_preferred: false, machine_code: 'M06', machine_name: 'Assembly Station' }
          ]
        },
        {
          id: 116,
          job_id: 4,
          operation_number: 'OP-40',
          operation_name: 'Assembly',
          processing_time: 1.5,
          sequence_number: 4,
          priority: 'MEDIUM',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 6, processing_time: 1.5, is_preferred: true, machine_code: 'M06', machine_name: 'Assembly Station' },
            { machine_id: 4, processing_time: 2.0, is_preferred: false, machine_code: 'M04', machine_name: 'Welding Station' }
          ]
        }
      ]
    },
    {
      id: 5,
      job_number: 'JOB-005',
      customer_name: 'HydraFlow Industrial',
      product_name: 'Pressure Relief Manifold',
      quantity: 15,
      priority: 'URGENT',
      due_date: '2026-03-23T18:00:00Z',
      status: 'SCHEDULED',
      estimated_processing_time: 6.8,
      created_at: '2026-03-20T10:00:00Z',
      operations: [
        {
          id: 117,
          job_id: 5,
          operation_number: 'OP-10',
          operation_name: 'Cutting',
          processing_time: 1.6,
          sequence_number: 1,
          priority: 'URGENT',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 1, processing_time: 1.6, is_preferred: true, machine_code: 'M01', machine_name: 'CNC Cutting Machine' },
            { machine_id: 2, processing_time: 2.2, is_preferred: false, machine_code: 'M02', machine_name: 'CNC Milling Machine' }
          ]
        },
        {
          id: 118,
          job_id: 5,
          operation_number: 'OP-20',
          operation_name: 'Drilling',
          processing_time: 2.4,
          sequence_number: 2,
          priority: 'URGENT',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 3, processing_time: 2.4, is_preferred: true, machine_code: 'M03', machine_name: 'Drilling Machine' },
            { machine_id: 2, processing_time: 3.0, is_preferred: false, machine_code: 'M02', machine_name: 'CNC Milling Machine' }
          ]
        },
        {
          id: 119,
          job_id: 5,
          operation_number: 'OP-30',
          operation_name: 'Painting',
          processing_time: 1.2,
          sequence_number: 3,
          priority: 'URGENT',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 5, processing_time: 1.2, is_preferred: true, machine_code: 'M05', machine_name: 'Painting Station' },
            { machine_id: 6, processing_time: 1.8, is_preferred: false, machine_code: 'M06', machine_name: 'Assembly Station' }
          ]
        },
        {
          id: 120,
          job_id: 5,
          operation_number: 'OP-40',
          operation_name: 'Assembly',
          processing_time: 1.6,
          sequence_number: 4,
          priority: 'URGENT',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 6, processing_time: 1.6, is_preferred: true, machine_code: 'M06', machine_name: 'Assembly Station' },
            { machine_id: 4, processing_time: 2.2, is_preferred: false, machine_code: 'M04', machine_name: 'Welding Station' }
          ]
        }
      ]
    },
    {
      id: 6,
      job_number: 'JOB-006',
      customer_name: 'AeroStructure Dynamics',
      product_name: 'Flap Actuation Link Rod',
      quantity: 30,
      priority: 'MEDIUM',
      due_date: '2026-03-25T14:00:00Z',
      status: 'SCHEDULED',
      estimated_processing_time: 5.3,
      created_at: '2026-03-20T10:30:00Z',
      operations: [
        {
          id: 121,
          job_id: 6,
          operation_number: 'OP-10',
          operation_name: 'Milling',
          processing_time: 1.8,
          sequence_number: 1,
          priority: 'MEDIUM',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 2, processing_time: 1.8, is_preferred: true, machine_code: 'M02', machine_name: 'CNC Milling Machine' },
            { machine_id: 1, processing_time: 2.4, is_preferred: false, machine_code: 'M01', machine_name: 'CNC Cutting Machine' }
          ]
        },
        {
          id: 122,
          job_id: 6,
          operation_number: 'OP-20',
          operation_name: 'Welding',
          processing_time: 1.5,
          sequence_number: 2,
          priority: 'MEDIUM',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 4, processing_time: 1.5, is_preferred: true, machine_code: 'M04', machine_name: 'Welding Station' },
            { machine_id: 6, processing_time: 2.0, is_preferred: false, machine_code: 'M06', machine_name: 'Assembly Station' }
          ]
        },
        {
          id: 123,
          job_id: 6,
          operation_number: 'OP-30',
          operation_name: 'Assembly',
          processing_time: 2.0,
          sequence_number: 3,
          priority: 'MEDIUM',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 6, processing_time: 2.0, is_preferred: true, machine_code: 'M06', machine_name: 'Assembly Station' },
            { machine_id: 4, processing_time: 2.5, is_preferred: false, machine_code: 'M04', machine_name: 'Welding Station' }
          ]
        }
      ]
    },
    {
      id: 7,
      job_number: 'JOB-007',
      customer_name: 'Solaris Energy Solutions',
      product_name: 'Turbine Hub Mount Collar',
      quantity: 20,
      priority: 'HIGH',
      due_date: '2026-03-24T12:00:00Z',
      status: 'SCHEDULED',
      estimated_processing_time: 5.6,
      created_at: '2026-03-20T11:00:00Z',
      operations: [
        {
          id: 124,
          job_id: 7,
          operation_number: 'OP-10',
          operation_name: 'Cutting',
          processing_time: 1.4,
          sequence_number: 1,
          priority: 'HIGH',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 1, processing_time: 1.4, is_preferred: true, machine_code: 'M01', machine_name: 'CNC Cutting Machine' },
            { machine_id: 2, processing_time: 1.9, is_preferred: false, machine_code: 'M02', machine_name: 'CNC Milling Machine' }
          ]
        },
        {
          id: 125,
          job_id: 7,
          operation_number: 'OP-20',
          operation_name: 'Milling',
          processing_time: 2.6,
          sequence_number: 2,
          priority: 'HIGH',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 2, processing_time: 2.6, is_preferred: true, machine_code: 'M02', machine_name: 'CNC Milling Machine' },
            { machine_id: 1, processing_time: 3.2, is_preferred: false, machine_code: 'M01', machine_name: 'CNC Cutting Machine' }
          ]
        },
        {
          id: 126,
          job_id: 7,
          operation_number: 'OP-30',
          operation_name: 'Assembly',
          processing_time: 1.6,
          sequence_number: 3,
          priority: 'HIGH',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 6, processing_time: 1.6, is_preferred: true, machine_code: 'M06', machine_name: 'Assembly Station' },
            { machine_id: 4, processing_time: 2.1, is_preferred: false, machine_code: 'M04', machine_name: 'Welding Station' }
          ]
        }
      ]
    },
    {
      id: 8,
      job_number: 'JOB-008',
      customer_name: 'Precision Heavy Forge',
      product_name: 'Armored Enclosure Bearing Ring',
      quantity: 8,
      priority: 'LOW',
      due_date: '2026-03-26T18:00:00Z',
      status: 'SCHEDULED',
      estimated_processing_time: 7.6,
      created_at: '2026-03-20T11:30:00Z',
      operations: [
        {
          id: 127,
          job_id: 8,
          operation_number: 'OP-10',
          operation_name: 'Drilling',
          processing_time: 2.0,
          sequence_number: 1,
          priority: 'LOW',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 3, processing_time: 2.0, is_preferred: true, machine_code: 'M03', machine_name: 'Drilling Machine' },
            { machine_id: 1, processing_time: 2.5, is_preferred: false, machine_code: 'M01', machine_name: 'CNC Cutting Machine' }
          ]
        },
        {
          id: 128,
          job_id: 8,
          operation_number: 'OP-20',
          operation_name: 'Welding',
          processing_time: 2.4,
          sequence_number: 2,
          priority: 'LOW',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 4, processing_time: 2.4, is_preferred: true, machine_code: 'M04', machine_name: 'Welding Station' },
            { machine_id: 6, processing_time: 3.0, is_preferred: false, machine_code: 'M06', machine_name: 'Assembly Station' }
          ]
        },
        {
          id: 129,
          job_id: 8,
          operation_number: 'OP-30',
          operation_name: 'Painting',
          processing_time: 1.4,
          sequence_number: 3,
          priority: 'LOW',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 5, processing_time: 1.4, is_preferred: true, machine_code: 'M05', machine_name: 'Painting Station' },
            { machine_id: 6, processing_time: 1.9, is_preferred: false, machine_code: 'M06', machine_name: 'Assembly Station' }
          ]
        },
        {
          id: 130,
          job_id: 8,
          operation_number: 'OP-40',
          operation_name: 'Assembly',
          processing_time: 1.8,
          sequence_number: 4,
          priority: 'LOW',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 6, processing_time: 1.8, is_preferred: true, machine_code: 'M06', machine_name: 'Assembly Station' },
            { machine_id: 4, processing_time: 2.4, is_preferred: false, machine_code: 'M04', machine_name: 'Welding Station' }
          ]
        }
      ]
    },
    {
      id: 9,
      job_number: 'JOB-009',
      customer_name: 'TurbineTech Global',
      product_name: 'Combustor Outer Nozzle Ring',
      quantity: 14,
      priority: 'MEDIUM',
      due_date: '2026-03-25T16:00:00Z',
      status: 'SCHEDULED',
      estimated_processing_time: 8.0,
      created_at: '2026-03-20T12:00:00Z',
      operations: [
        {
          id: 131,
          job_id: 9,
          operation_number: 'OP-10',
          operation_name: 'Cutting',
          processing_time: 1.5,
          sequence_number: 1,
          priority: 'MEDIUM',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 1, processing_time: 1.5, is_preferred: true, machine_code: 'M01', machine_name: 'CNC Cutting Machine' },
            { machine_id: 2, processing_time: 2.0, is_preferred: false, machine_code: 'M02', machine_name: 'CNC Milling Machine' }
          ]
        },
        {
          id: 132,
          job_id: 9,
          operation_number: 'OP-20',
          operation_name: 'Milling',
          processing_time: 2.0,
          sequence_number: 2,
          priority: 'MEDIUM',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 2, processing_time: 2.0, is_preferred: true, machine_code: 'M02', machine_name: 'CNC Milling Machine' },
            { machine_id: 3, processing_time: 2.6, is_preferred: false, machine_code: 'M03', machine_name: 'Drilling Machine' }
          ]
        },
        {
          id: 133,
          job_id: 9,
          operation_number: 'OP-30',
          operation_name: 'Drilling',
          processing_time: 1.5,
          sequence_number: 3,
          priority: 'MEDIUM',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 3, processing_time: 1.5, is_preferred: true, machine_code: 'M03', machine_name: 'Drilling Machine' },
            { machine_id: 1, processing_time: 2.1, is_preferred: false, machine_code: 'M01', machine_name: 'CNC Cutting Machine' }
          ]
        },
        {
          id: 134,
          job_id: 9,
          operation_number: 'OP-40',
          operation_name: 'Painting',
          processing_time: 1.0,
          sequence_number: 4,
          priority: 'MEDIUM',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 5, processing_time: 1.0, is_preferred: true, machine_code: 'M05', machine_name: 'Painting Station' },
            { machine_id: 6, processing_time: 1.5, is_preferred: false, machine_code: 'M06', machine_name: 'Assembly Station' }
          ]
        },
        {
          id: 135,
          job_id: 9,
          operation_number: 'OP-50',
          operation_name: 'Assembly',
          processing_time: 2.0,
          sequence_number: 5,
          priority: 'MEDIUM',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 6, processing_time: 2.0, is_preferred: true, machine_code: 'M06', machine_name: 'Assembly Station' },
            { machine_id: 4, processing_time: 2.6, is_preferred: false, machine_code: 'M04', machine_name: 'Welding Station' }
          ]
        }
      ]
    },
    {
      id: 10,
      job_number: 'JOB-010',
      customer_name: 'CyberKinetics Ortho',
      product_name: 'Prosthetic Titanium Joint Hinge',
      quantity: 16,
      priority: 'LOW',
      due_date: '2026-03-26T12:00:00Z',
      status: 'SCHEDULED',
      estimated_processing_time: 5.5,
      created_at: '2026-03-20T13:00:00Z',
      operations: [
        {
          id: 136,
          job_id: 10,
          operation_number: 'OP-10',
          operation_name: 'Milling',
          processing_time: 2.2,
          sequence_number: 1,
          priority: 'LOW',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 2, processing_time: 2.2, is_preferred: true, machine_code: 'M02', machine_name: 'CNC Milling Machine' },
            { machine_id: 1, processing_time: 2.8, is_preferred: false, machine_code: 'M01', machine_name: 'CNC Cutting Machine' }
          ]
        },
        {
          id: 137,
          job_id: 10,
          operation_number: 'OP-20',
          operation_name: 'Welding',
          processing_time: 1.8,
          sequence_number: 2,
          priority: 'LOW',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 4, processing_time: 1.8, is_preferred: true, machine_code: 'M04', machine_name: 'Welding Station' },
            { machine_id: 6, processing_time: 2.3, is_preferred: false, machine_code: 'M06', machine_name: 'Assembly Station' }
          ]
        },
        {
          id: 138,
          job_id: 10,
          operation_number: 'OP-30',
          operation_name: 'Assembly',
          processing_time: 1.5,
          sequence_number: 3,
          priority: 'LOW',
          status: 'PENDING',
          eligible_machines: [
            { machine_id: 6, processing_time: 1.5, is_preferred: true, machine_code: 'M06', machine_name: 'Assembly Station' },
            { machine_id: 4, processing_time: 2.0, is_preferred: false, machine_code: 'M04', machine_name: 'Welding Station' }
          ]
        }
      ]
    }
  ];

  const initialSchedule = runScheduler(jobs, machines, 'quantum_inspired');

  const alerts: Alert[] = [
    {
      id: 1,
      type: 'maintenance',
      title: 'Machine M05 Scheduled Maintenance Window',
      message: 'Painting Station is scheduled for filter replacement and nozzle calibration from 08:00 to 12:00 (0.0h - 4.0h).',
      severity: 'warning',
      is_read: false,
      created_at: '2026-03-20T08:00:00Z'
    },
    {
      id: 2,
      type: 'urgent_job',
      title: 'Urgent Order: JOB-001 Titanium Bracket',
      message: 'Job JOB-001 has highest dispatch priority. Sequential operations allocated to M01, M02, M03, and M06.',
      severity: 'danger',
      is_read: false,
      created_at: '2026-03-20T08:15:00Z'
    },
    {
      id: 3,
      type: 'quantum_optimization',
      title: 'Quantum-Inspired Optimal Schedule Active',
      message: `Initial DFJSSP schedule computed: Makespan ${initialSchedule.makespan}h across 6 machine centers with ${initialSchedule.utilization}% average utilization.`,
      severity: 'success',
      is_read: true,
      created_at: '2026-03-20T08:30:00Z'
    }
  ];

  return {
    profile: {
      factory_code: 'QFB-AMR-DEMO',
      factory_name: 'Amaravati Precision Quantum Aerospace Center',
      industry: 'Aerospace, Defense & Precision Engineering',
      location: 'Amaravati Quantum Manufacturing Bay, Andhra Pradesh, India',
      contact_email: 'ops-director@quantumfactory.local',
      working_hours: '24/7 Continuous Shift Schedule (3x 8h shifts)',
      time_zone: 'Asia/Kolkata (IST, UTC+5:30)',
      is_demo: true,
    },
    machines,
    jobs,
    schedules: [initialSchedule],
    alerts,
    nextMachineId: 7,
    nextJobId: 11,
    nextOpId: 139,
    nextScheduleId: 2,
    nextAlertId: 4,
  };
}
