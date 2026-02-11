-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE maintenance_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE vehicle_status AS ENUM ('available', 'in_maintenance', 'unavailable');

-- Vehicles table
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate VARCHAR(10) UNIQUE NOT NULL,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(50),
  status vehicle_status DEFAULT 'available',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT year_check CHECK (year >= 1900 AND year <= 2100)
);

-- Maintenance orders table
CREATE TABLE maintenance_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  status maintenance_status DEFAULT 'pending',
  priority INTEGER DEFAULT 1,
  estimated_hours DECIMAL(10,2),
  actual_hours DECIMAL(10,2),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  completed_by UUID REFERENCES auth.users(id),
  notes TEXT,
  CONSTRAINT priority_check CHECK (priority >= 1 AND priority <= 5),
  CONSTRAINT hours_check CHECK (estimated_hours >= 0 AND actual_hours >= 0)
);

-- Maintenance history/timeline table
CREATE TABLE maintenance_timeline (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maintenance_order_id UUID NOT NULL REFERENCES maintenance_orders(id) ON DELETE CASCADE,
  status maintenance_status NOT NULL,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  changed_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Downtime tracking table (tempo parado)
CREATE TABLE vehicle_downtime (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  maintenance_order_id UUID REFERENCES maintenance_orders(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  downtime_hours DECIMAL(10,2) GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time)) / 3600
  ) STORED,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_plate ON vehicles(plate);
CREATE INDEX idx_maintenance_orders_vehicle ON maintenance_orders(vehicle_id);
CREATE INDEX idx_maintenance_orders_status ON maintenance_orders(status);
CREATE INDEX idx_maintenance_orders_dates ON maintenance_orders(start_date, end_date);
CREATE INDEX idx_maintenance_timeline_order ON maintenance_timeline(maintenance_order_id);
CREATE INDEX idx_vehicle_downtime_vehicle ON vehicle_downtime(vehicle_id);
CREATE INDEX idx_vehicle_downtime_dates ON vehicle_downtime(start_time, end_time);

-- Row Level Security (RLS) Policies
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_downtime ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Users can view all vehicles" ON vehicles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert vehicles" ON vehicles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update vehicles" ON vehicles
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view all maintenance orders" ON maintenance_orders
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert maintenance orders" ON maintenance_orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update maintenance orders" ON maintenance_orders
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can view maintenance timeline" ON maintenance_timeline
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert maintenance timeline" ON maintenance_timeline
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can view vehicle downtime" ON vehicle_downtime
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert vehicle downtime" ON vehicle_downtime
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update vehicle downtime" ON vehicle_downtime
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_orders_updated_at BEFORE UPDATE ON maintenance_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update vehicle status based on maintenance orders
CREATE OR REPLACE FUNCTION update_vehicle_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'in_progress' THEN
    UPDATE vehicles SET status = 'in_maintenance' WHERE id = NEW.vehicle_id;
  ELSIF NEW.status = 'completed' OR NEW.status = 'cancelled' THEN
    UPDATE vehicles SET status = 'available' WHERE id = NEW.vehicle_id
    AND NOT EXISTS (
      SELECT 1 FROM maintenance_orders 
      WHERE vehicle_id = NEW.vehicle_id 
      AND status = 'in_progress'
      AND id != NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_vehicle_status
AFTER INSERT OR UPDATE OF status ON maintenance_orders
FOR EACH ROW EXECUTE FUNCTION update_vehicle_status();

-- Function to track maintenance timeline
CREATE OR REPLACE FUNCTION track_maintenance_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') OR (OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO maintenance_timeline (maintenance_order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, NEW.created_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_track_maintenance_timeline
AFTER INSERT OR UPDATE OF status ON maintenance_orders
FOR EACH ROW EXECUTE FUNCTION track_maintenance_status_change();

-- Function to auto-close downtime when maintenance completes
CREATE OR REPLACE FUNCTION auto_close_downtime()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' OR NEW.status = 'cancelled' THEN
    UPDATE vehicle_downtime 
    SET end_time = NOW()
    WHERE maintenance_order_id = NEW.id 
    AND end_time IS NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_close_downtime
AFTER UPDATE OF status ON maintenance_orders
FOR EACH ROW EXECUTE FUNCTION auto_close_downtime();

-- Views for reporting
CREATE OR REPLACE VIEW v_vehicles_in_maintenance AS
SELECT 
  v.id,
  v.plate,
  v.brand,
  v.model,
  v.year,
  mo.order_number,
  mo.description,
  mo.status,
  mo.start_date,
  mo.estimated_hours,
  EXTRACT(EPOCH FROM (NOW() - mo.start_date)) / 3600 AS hours_in_maintenance
FROM vehicles v
INNER JOIN maintenance_orders mo ON v.id = mo.vehicle_id
WHERE mo.status = 'in_progress';

CREATE OR REPLACE VIEW v_vehicle_downtime_summary AS
SELECT 
  v.id AS vehicle_id,
  v.plate,
  v.brand,
  v.model,
  COUNT(vd.id) AS total_downtime_events,
  SUM(vd.downtime_hours) AS total_downtime_hours,
  AVG(vd.downtime_hours) AS avg_downtime_hours,
  MAX(vd.downtime_hours) AS max_downtime_hours
FROM vehicles v
LEFT JOIN vehicle_downtime vd ON v.id = vd.vehicle_id
GROUP BY v.id, v.plate, v.brand, v.model;

CREATE OR REPLACE VIEW v_maintenance_performance AS
SELECT 
  mo.id,
  mo.order_number,
  v.plate,
  mo.description,
  mo.status,
  mo.estimated_hours,
  mo.actual_hours,
  CASE 
    WHEN mo.actual_hours IS NOT NULL AND mo.estimated_hours IS NOT NULL 
    THEN ((mo.actual_hours - mo.estimated_hours) / mo.estimated_hours * 100)
    ELSE NULL
  END AS variance_percentage,
  mo.start_date,
  mo.end_date,
  EXTRACT(EPOCH FROM (COALESCE(mo.end_date, NOW()) - mo.start_date)) / 3600 AS total_elapsed_hours
FROM maintenance_orders mo
INNER JOIN vehicles v ON mo.vehicle_id = v.id;
