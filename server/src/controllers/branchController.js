const db = require('../models');
const { Branch } = db;

exports.getAll = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const branches = await Branch.findAll({ where: { tenant_id: tenantId } });
    res.json(branches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant.id;
    const branch = await Branch.findOne({ where: { id, tenant_id: tenantId } });
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    res.json(branch);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { name, address, phone, isActive } = req.body;
    const branch = await Branch.create({ name, address, phone, isActive, tenant_id: tenantId });
    res.status(201).json(branch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant.id;
    const branch = await Branch.findOne({ where: { id, tenant_id: tenantId } });
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    const { name, address, phone, isActive } = req.body;
    await branch.update({ name, address, phone, isActive });
    res.json(branch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant.id;
    const branch = await Branch.findOne({ where: { id, tenant_id: tenantId } });
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    await branch.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
