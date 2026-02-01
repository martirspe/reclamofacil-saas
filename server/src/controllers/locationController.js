// Data Model
const { Location } = require('../models');
const { Op, fn, col } = require('sequelize');
const { sequelize } = require('../config/db');

// Create a new location
exports.createLocation = async (req, res) => {
  try {
    const { ubigeo, district, province, department } = req.body;
    const newLocation = await Location.create({ ubigeo, district, province, department });
    res.status(201).json({ message: 'Ubicación registrada correctamente', data: newLocation });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar la ubicación: ' + error.message });
  }
};

// Get all locations (with optional filtering)
exports.getLocations = async (req, res) => {
  try {
    const { department, province, search, active = true } = req.query;
    
    const whereClause = { active };

    // Filtro por departamento
    if (department) {
      whereClause.department = department;
    }

    // Filtro por provincia
    if (province) {
      whereClause.province = province;
    }

    // Búsqueda por texto en distrito, provincia o departamento (case-insensitive)
    if (search) {
      const searchTerm = `%${search}%`;
      whereClause[Op.or] = [
        sequelize.where(sequelize.fn('UPPER', sequelize.col('district')), Op.like, searchTerm.toUpperCase()),
        sequelize.where(sequelize.fn('UPPER', sequelize.col('province')), Op.like, searchTerm.toUpperCase()),
        sequelize.where(sequelize.fn('UPPER', sequelize.col('department')), Op.like, searchTerm.toUpperCase())
      ];
    }

    const locations = await Location.findAll({
      where: whereClause,
      order: [
        ['department', 'ASC'],
        ['province', 'ASC'],
        ['district', 'ASC']
      ]
    });

    // Check if there are registered locations
    if (locations.length === 0) {
      return res.status(404).json({ message: 'No hay ubicaciones registradas' });
    }

    res.status(200).json(locations);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ubicaciones: ' + error.message });
  }
};

// Get all departments (unique list)
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Location.findAll({
      attributes: [
        'department',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { active: true },
      group: ['department'],
      order: [['department', 'ASC']]
    });

    const departmentList = departments.map(loc => ({
      name: loc.department,
      count: parseInt(loc.dataValues.count, 10)
    }));

    if (departmentList.length === 0) {
      return res.status(404).json({ message: 'No hay departamentos registrados' });
    }

    res.status(200).json(departmentList);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener departamentos: ' + error.message });
  }
};

// Get provinces by department
exports.getProvincesByDepartment = async (req, res) => {
  try {
    const { department } = req.params;

    const provinces = await Location.findAll({
      attributes: [
        'province',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: { 
        department,
        active: true 
      },
      group: ['province'],
      order: [['province', 'ASC']]
    });

    const provinceList = provinces.map(loc => ({
      name: loc.province,
      count: parseInt(loc.dataValues.count, 10)
    }));

    if (provinceList.length === 0) {
      return res.status(404).json({ message: 'No hay provincias registradas para este departamento' });
    }

    res.status(200).json(provinceList);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener provincias: ' + error.message });
  }
};

// Get districts by province and department
exports.getDistrictsByProvince = async (req, res) => {
  try {
    const { department, province } = req.params;

    const districts = await Location.findAll({
      where: { 
        department,
        province,
        active: true 
      },
      order: [['district', 'ASC']]
    });

    if (districts.length === 0) {
      return res.status(404).json({ message: 'No hay distritos registrados para esta provincia' });
    }

    res.status(200).json(districts);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener distritos: ' + error.message });
  }
};

// Get a location by ID
exports.getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findByPk(id);
    if (!location) {
      return res.status(404).json({ message: 'La ubicación no fue encontrada' });
    }
    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la ubicación: ' + error.message });
  }
};

// Get a location by UBIGEO
exports.getLocationByUbigeo = async (req, res) => {
  try {
    const { ubigeo } = req.params;
    const location = await Location.findOne({ where: { ubigeo } });
    if (!location) {
      return res.status(404).json({ message: 'La ubicación no fue encontrada' });
    }
    res.status(200).json(location);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener la ubicación: ' + error.message });
  }
};

// Update a location
exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { ubigeo, district, province, department, active } = req.body;
    const location = await Location.findByPk(id);
    if (!location) {
      return res.status(404).json({ message: 'La ubicación no fue encontrada' });
    }
    await location.update({ ubigeo, district, province, department, active });
    res.status(200).json({ message: 'Ubicación actualizada correctamente', data: location });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la ubicación: ' + error.message });
  }
};

// Delete a location (soft delete)
exports.deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findByPk(id);
    if (!location) {
      return res.status(404).json({ message: 'La ubicación no fue encontrada' });
    }
    await location.update({ active: false });
    res.status(200).json({ message: 'Ubicación desactivada correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al desactivar la ubicación: ' + error.message });
  }
};
