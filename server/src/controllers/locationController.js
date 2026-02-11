// Data Model
const { Location } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/db');

const normalizeText = (value) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text.toUpperCase() : null;
};

const normalizeUbigeo = (value) => {
  if (value === null || value === undefined) return null;
  return String(value).trim();
};

const parseBoolean = (value) => {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) return true;
  if (['false', '0', 'no'].includes(normalized)) return false;
  if (normalized === 'all') return undefined;
  return undefined;
};

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 0, 0);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 0, 0), 200);
  if (!page || !limit) {
    return null;
  }
  return { page, limit, offset: (page - 1) * limit };
};

// Create a new location
exports.createLocation = async (req, res) => {
  try {
    const ubigeo = normalizeUbigeo(req.body?.ubigeo);
    const district = normalizeText(req.body?.district);
    const province = normalizeText(req.body?.province);
    const department = normalizeText(req.body?.department);

    if (!ubigeo || !district || !province || !department) {
      return res.status(400).json({
        message: 'ubigeo, district, province y department son requeridos',
        error: 'VALIDATION_ERROR'
      });
    }

    const existing = await Location.findOne({ where: { ubigeo } });
    if (existing) {
      return res.status(409).json({
        message: 'El ubigeo ya existe',
        error: 'DUPLICATE_UBIGEO'
      });
    }

    const newLocation = await Location.create({ ubigeo, district, province, department });
    res.status(201).json({
      message: 'Ubicación registrada correctamente',
      data: newLocation
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al registrar la ubicacion',
      error: error.message
    });
  }
};

// Get all locations (with optional filtering)
exports.getLocations = async (req, res) => {
  try {
    const activeValue = parseBoolean(req.query?.active);
    const whereClause = {};
    if (activeValue !== undefined) {
      whereClause.active = activeValue;
    }

    // Filtro por departamento
    if (req.query?.department) {
      whereClause.department = normalizeText(req.query.department);
    }

    // Filtro por provincia
    if (req.query?.province) {
      whereClause.province = normalizeText(req.query.province);
    }

    // Búsqueda por texto en distrito, provincia o departamento (case-insensitive)
    if (req.query?.search) {
      const searchTerm = `%${String(req.query.search).trim()}%`;
      whereClause[Op.or] = [
        sequelize.where(sequelize.fn('UPPER', sequelize.col('district')), Op.like, searchTerm.toUpperCase()),
        sequelize.where(sequelize.fn('UPPER', sequelize.col('province')), Op.like, searchTerm.toUpperCase()),
        sequelize.where(sequelize.fn('UPPER', sequelize.col('department')), Op.like, searchTerm.toUpperCase())
      ];
    }

    const pagination = parsePagination(req.query || {});
    let locations;
    let total = null;

    const baseQuery = {
      where: whereClause,
      order: [
        ['department', 'ASC'],
        ['province', 'ASC'],
        ['district', 'ASC']
      ]
    };

    if (pagination) {
      const result = await Location.findAndCountAll({
        ...baseQuery,
        limit: pagination.limit,
        offset: pagination.offset
      });
      locations = result.rows;
      total = result.count;
    } else {
      locations = await Location.findAll(baseQuery);
    }

    // Check if there are registered locations
    if (locations.length === 0) {
      return res.status(404).json({
        message: 'No hay ubicaciones registradas',
        error: 'NOT_FOUND'
      });
    }

    if (pagination) {
      return res.status(200).json({
        message: 'Ubicaciones obtenidas correctamente',
        data: locations,
        pagination: {
          total,
          page: pagination.page,
          limit: pagination.limit,
          pages: Math.ceil(total / pagination.limit)
        }
      });
    }

    res.status(200).json({
      message: 'Ubicaciones obtenidas correctamente',
      data: locations
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener ubicaciones',
      error: error.message
    });
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
      return res.status(404).json({
        message: 'No hay departamentos registrados',
        error: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      message: 'Departamentos obtenidos correctamente',
      data: departmentList
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener departamentos',
      error: error.message
    });
  }
};

// Get provinces by department
exports.getProvincesByDepartment = async (req, res) => {
  try {
    const department = normalizeText(req.params?.department);
    if (!department) {
      return res.status(400).json({
        message: 'department es requerido',
        error: 'VALIDATION_ERROR'
      });
    }

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
      return res.status(404).json({
        message: 'No hay provincias registradas para este departamento',
        error: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      message: 'Provincias obtenidas correctamente',
      data: provinceList
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener provincias',
      error: error.message
    });
  }
};

// Get districts by province and department
exports.getDistrictsByProvince = async (req, res) => {
  try {
    const department = normalizeText(req.params?.department);
    const province = normalizeText(req.params?.province);

    if (!department || !province) {
      return res.status(400).json({
        message: 'department y province son requeridos',
        error: 'VALIDATION_ERROR'
      });
    }

    const districts = await Location.findAll({
      where: { 
        department,
        province,
        active: true 
      },
      order: [['district', 'ASC']]
    });

    if (districts.length === 0) {
      return res.status(404).json({
        message: 'No hay distritos registrados para esta provincia',
        error: 'NOT_FOUND'
      });
    }

    res.status(200).json({
      message: 'Distritos obtenidos correctamente',
      data: districts
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener distritos',
      error: error.message
    });
  }
};

// Get a location by ID
exports.getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findByPk(id);
    if (!location) {
      return res.status(404).json({
        message: 'La ubicacion no fue encontrada',
        error: 'NOT_FOUND'
      });
    }
    res.status(200).json({
      message: 'Ubicación obtenida correctamente',
      data: location
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener la ubicacion',
      error: error.message
    });
  }
};

// Get a location by UBIGEO
exports.getLocationByUbigeo = async (req, res) => {
  try {
    const ubigeo = normalizeUbigeo(req.params?.ubigeo);
    if (!ubigeo) {
      return res.status(400).json({
        message: 'ubigeo es requerido',
        error: 'VALIDATION_ERROR'
      });
    }
    const location = await Location.findOne({ where: { ubigeo } });
    if (!location) {
      return res.status(404).json({
        message: 'La ubicacion no fue encontrada',
        error: 'NOT_FOUND'
      });
    }
    res.status(200).json({
      message: 'Ubicación obtenida correctamente',
      data: location
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener la ubicacion',
      error: error.message
    });
  }
};

// Update a location
exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const ubigeo = normalizeUbigeo(req.body?.ubigeo);
    const district = normalizeText(req.body?.district);
    const province = normalizeText(req.body?.province);
    const department = normalizeText(req.body?.department);
    const active = parseBoolean(req.body?.active);
    const location = await Location.findByPk(id);
    if (!location) {
      return res.status(404).json({
        message: 'La ubicacion no fue encontrada',
        error: 'NOT_FOUND'
      });
    }

    if (ubigeo && ubigeo !== location.ubigeo) {
      const existing = await Location.findOne({ where: { ubigeo } });
      if (existing) {
        return res.status(409).json({
          message: 'El ubigeo ya existe',
          error: 'DUPLICATE_UBIGEO'
        });
      }
    }

    await location.update({
      ubigeo: ubigeo ?? location.ubigeo,
      district: district ?? location.district,
      province: province ?? location.province,
      department: department ?? location.department,
      active: active ?? location.active
    });
    res.status(200).json({
      message: 'Ubicación actualizada correctamente',
      data: location
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al actualizar la ubicacion',
      error: error.message
    });
  }
};

// Delete a location (soft delete)
exports.deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findByPk(id);
    if (!location) {
      return res.status(404).json({
        message: 'La ubicacion no fue encontrada',
        error: 'NOT_FOUND'
      });
    }
    await location.update({ active: false });
    res.status(200).json({
      message: 'Ubicación desactivada correctamente',
      data: { id: location.id, active: location.active }
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al desactivar la ubicacion',
      error: error.message
    });
  }
};
