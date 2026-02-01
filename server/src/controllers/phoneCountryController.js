const PhoneCountry = require('../models/PhoneCountry');

// GET /api/phone-countries
exports.getAllPhoneCountries = async (req, res) => {
  try {
    const countries = await PhoneCountry.findAll({
      attributes: ['id', 'name', 'code', 'iso', 'flag'],
      order: [['name', 'ASC']]
    });
    res.json(countries);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener países', error: err.message });
  }
};

// GET /api/phone-countries/:id
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const country = await PhoneCountry.findByPk(id);
    if (!country) {
      return res.status(404).json({ message: 'País no encontrado' });
    }
    res.json(country);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener el país', error: err.message });
  }
};

// POST /api/phone-countries
exports.create = async (req, res) => {
  try {
    const { name, code, iso, flag } = req.body;
    const country = await PhoneCountry.create({ name, code, iso, flag });
    res.status(201).json(country);
  } catch (err) {
    res.status(400).json({ message: 'Error al crear el país', error: err.message });
  }
};

// PUT /api/phone-countries/:id
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, iso, flag } = req.body;
    const country = await PhoneCountry.findByPk(id);
    if (!country) {
      return res.status(404).json({ message: 'País no encontrado' });
    }
    await country.update({ name, code, iso, flag });
    res.json(country);
  } catch (err) {
    res.status(400).json({ message: 'Error al actualizar el país', error: err.message });
  }
};

// DELETE /api/phone-countries/:id
exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const country = await PhoneCountry.findByPk(id);
    if (!country) {
      return res.status(404).json({ message: 'País no encontrado' });
    }
    await country.destroy();
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar el país', error: err.message });
  }
};