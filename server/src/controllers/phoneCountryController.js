const PhoneCountry = require('../models/PhoneCountry');

const normalizeText = (value) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text.toUpperCase() : null;
};

const normalizeName = (value) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text || null;
};

const isValidIso = (value) => typeof value === 'string' && /^[A-Z]{2}$/.test(value.trim().toUpperCase());

// GET /api/phone-countries
exports.getAllPhoneCountries = async (req, res) => {
  try {
    const countries = await PhoneCountry.findAll({
      attributes: ['id', 'name', 'code', 'iso', 'flag'],
      order: [['name', 'ASC']]
    });
    res.json({
      message: 'Países obtenidos correctamente',
      data: countries
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error al obtener países',
      error: err.message
    });
  }
};

// GET /api/phone-countries/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const country = await PhoneCountry.findByPk(id);
    if (!country) {
      return res.status(404).json({
        message: 'País no encontrado',
        error: 'NOT_FOUND'
      });
    }
    res.json({
      message: 'País obtenido correctamente',
      data: country
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error al obtener el país',
      error: err.message
    });
  }
};

// POST /api/phone-countries
exports.create = async (req, res) => {
  try {
    const name = normalizeName(req.body?.name);
    const code = normalizeText(req.body?.code);
    const iso = normalizeText(req.body?.iso);
    const flag = normalizeName(req.body?.flag);

    if (!name || !code || !iso) {
      return res.status(400).json({
        message: 'name, code e iso son requeridos',
        error: 'VALIDATION_ERROR'
      });
    }

    if (!isValidIso(iso)) {
      return res.status(400).json({
        message: 'iso debe tener 2 letras (ISO 3166-1 alpha-2)',
        error: 'VALIDATION_ERROR'
      });
    }

    const existing = await PhoneCountry.findOne({ where: { iso } });
    if (existing) {
      return res.status(409).json({
        message: 'El ISO ya existe',
        error: 'DUPLICATE_ISO'
      });
    }

    const country = await PhoneCountry.create({ name, code, iso, flag });
    res.status(201).json({
      message: 'País creado correctamente',
      data: country
    });
  } catch (err) {
    res.status(400).json({
      message: 'Error al crear el país',
      error: err.message
    });
  }
};

// PUT /api/phone-countries/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const name = normalizeName(req.body?.name);
    const code = normalizeText(req.body?.code);
    const iso = normalizeText(req.body?.iso);
    const flag = normalizeName(req.body?.flag);

    if (iso && !isValidIso(iso)) {
      return res.status(400).json({
        message: 'iso debe tener 2 letras (ISO 3166-1 alpha-2)',
        error: 'VALIDATION_ERROR'
      });
    }

    const country = await PhoneCountry.findByPk(id);
    if (!country) {
      return res.status(404).json({
        message: 'País no encontrado',
        error: 'NOT_FOUND'
      });
    }

    if (iso && iso !== country.iso) {
      const existing = await PhoneCountry.findOne({ where: { iso } });
      if (existing) {
        return res.status(409).json({
          message: 'El ISO ya existe',
          error: 'DUPLICATE_ISO'
        });
      }
    }

    await country.update({
      name: name ?? country.name,
      code: code ?? country.code,
      iso: iso ?? country.iso,
      flag: flag ?? country.flag
    });

    res.json({
      message: 'País actualizado correctamente',
      data: country
    });
  } catch (err) {
    res.status(400).json({
      message: 'Error al actualizar el país',
      error: err.message
    });
  }
};

// DELETE /api/phone-countries/:id
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const country = await PhoneCountry.findByPk(id);
    if (!country) {
      return res.status(404).json({
        message: 'País no encontrado',
        error: 'NOT_FOUND'
      });
    }
    await country.destroy();
    res.status(200).json({
      message: 'País eliminado correctamente',
      data: { id: country.id }
    });
  } catch (err) {
    res.status(500).json({
      message: 'Error al eliminar el país',
      error: err.message
    });
  }
};