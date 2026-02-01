const db = require('../models');
const { ComplaintBook } = db;

/**
 * Obtiene el primer libro de reclamaciones del tenant (público)
 */
exports.getActiveComplaintBook = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const book = await ComplaintBook.findOne({
      where: { tenant_id: tenantId },
      order: [['id', 'ASC']]
    });
    if (!book) return res.status(404).json({ error: 'No complaint books found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const branchId = req.query.branchId;
    const where = { tenant_id: tenantId };
    if (branchId) where.branch_id = branchId;
    const books = await ComplaintBook.findAll({ where });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant.id;
    const book = await ComplaintBook.findOne({ where: { id, tenant_id: tenantId } });
    if (!book) return res.status(404).json({ error: 'ComplaintBook not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    let { code, description, isActive, branchId } = req.body;

    // Si no se proporciona code, generarlo automáticamente
    if (!code) {
      // Obtener datos del tenant y branch
      const db = require('../models');
      const tenant = await db.Tenant.findByPk(tenantId);
      const branch = await db.Branch.findByPk(branchId);
      if (!tenant || !branch) {
        return res.status(400).json({ error: 'Tenant o Branch no encontrado' });
      }
      // Utilidades para limpiar y extraer letras
      function clean(str) {
        return (str || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      }
      const tenantPrefix = clean(tenant.legal_name).substring(0, 3);
      const branchPrefix = clean(branch.name).substring(0, 3);
      const ruc = (tenant.tax_id || '').replace(/\D/g, '');
      const rucSuffix = ruc.substring(0, 3);
      // Buscar correlativo existente para la branch
      const lastBook = await ComplaintBook.findOne({
        where: { tenant_id: tenantId, branch_id: branchId },
        order: [['id', 'DESC']]
      });
      let nextNumber = 1;
      if (lastBook && lastBook.code) {
        const match = lastBook.code.match(/(\d{3})$/);
        if (match) nextNumber = parseInt(match[1], 10) + 1;
      }
      const numberSuffix = String(nextNumber).padStart(3, '0');
      code = `${tenantPrefix}-${branchPrefix}-${rucSuffix}-${numberSuffix}`;
    }

    const book = await ComplaintBook.create({ code, description, isActive, tenant_id: tenantId, branch_id: branchId });
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant.id;
    const book = await ComplaintBook.findOne({ where: { id, tenant_id: tenantId } });
    if (!book) return res.status(404).json({ error: 'ComplaintBook not found' });
    const { code, description, isActive, branchId } = req.body;
    await book.update({ code, description, isActive, branch_id: branchId });
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenant.id;
    const book = await ComplaintBook.findOne({ where: { id, tenant_id: tenantId } });
    if (!book) return res.status(404).json({ error: 'ComplaintBook not found' });
    await book.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
