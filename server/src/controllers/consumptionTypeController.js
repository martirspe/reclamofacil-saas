// Data Model
const { ConsumptionType } = require('../models');

// Create a new consumption type
exports.createConsumptionType = async (req, res) => {
  try {
    const consumptionType = await ConsumptionType.create(req.body);
    res.status(201).json({ message: 'Tipo de consumo registrado correctamente', data: consumptionType });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar el tipo de consumo: ' + error.message });
  }
};

// Get all consumption types
exports.getConsumptionTypes = async (req, res) => {
  try {
    const consumptionTypes = await ConsumptionType.findAll();

    // Check if there are registered consumption types
    if (consumptionTypes.length === 0) {
      return res.status(404).json({ message: 'No hay tipos de consumo registrados' });
    }

    res.status(200).json(consumptionTypes);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener tipos de consumo: ' + error.message });
  }
};

// Get a consumption type by ID
exports.getConsumptionTypeById = async (req, res) => {
  try {
    const consumptionType = await ConsumptionType.findByPk(req.params.id);
    if (!consumptionType) {
      return res.status(404).json({ message: "El tipo de consumo no fue encontrado" });
    }
    res.status(200).json(consumptionType);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el tipo de consumo: ' + error.message });
  }
};

// Update a consumption type
exports.updateConsumptionType = async (req, res) => {
  try {
    const { id } = req.params;
    const [updated] = await ConsumptionType.update(req.body, { where: { id } });
    if (updated) {
      const updatedConsumptionType = await ConsumptionType.findByPk(id);
      return res.status(200).json({ message: 'Tipo de consumo actualizado correctamente', data: updatedConsumptionType });
    }
    throw new Error("Consumption type not found");
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el tipo de consumo: ' + error.message });
  }
};

// Delete a consumption type
exports.deleteConsumptionType = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ConsumptionType.destroy({ where: { id } });
    if (deleted) {
      return res.status(200).json({ message: "El tipo de consumo fue eliminado correctamente" });
    }
    throw new Error("Consumption type not found");
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el tipo de consumo: ' + error.message });
  }
};