-- Add column for secondary materials configuration (agent results as inputs)
ALTER TABLE agent_configs 
ADD COLUMN secondary_materials_config integer[] DEFAULT '{}';