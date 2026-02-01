// Data Models
const { Currency } = require('../models');

// Get all currencies
exports.getCurrencies = async (req, res) => {
  try {
    const currencies = await Currency.findAll({
      where: { active: true },
      order: [['code', 'ASC']]
    });

    if (currencies.length === 0) {
      return res.status(404).json({ message: 'No hay monedas registradas' });
    }

    res.status(200).json(currencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a currency by ID
exports.getCurrencyById = async (req, res) => {
  try {
    const currency = await Currency.findByPk(req.params.id);

    if (!currency) {
      return res.status(404).json({ message: 'La moneda no fue encontrada' });
    }

    res.status(200).json(currency);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new currency (Admin only)
exports.createCurrency = async (req, res) => {
  try {
    const { code, name, symbol, active } = req.body;

    const currency = await Currency.create({
      code,
      name,
      symbol,
      active: active !== undefined ? active : true
    });

    res.status(201).json({
      message: 'Moneda creada correctamente',
      currency
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a currency (Admin only)
exports.updateCurrency = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, symbol, active } = req.body;

    const [updated] = await Currency.update(
      { code, name, symbol, active },
      { where: { id } }
    );

    if (!updated) {
      return res.status(404).json({ message: 'La moneda no fue encontrada' });
    }

    const currency = await Currency.findByPk(id);
    res.status(200).json({
      message: 'Moneda actualizada correctamente',
      currency
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a currency (Admin only)
exports.deleteCurrency = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Currency.destroy({ where: { id } });

    if (deleted) {
      return res.status(200).json({ message: 'Moneda eliminada correctamente' });
    }
    throw new Error('Currency not found');
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la moneda: ' + error.message });
  }
};
