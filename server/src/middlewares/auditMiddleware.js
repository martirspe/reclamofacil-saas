const logger = require('../utils/logger');
const { AuditLog } = require('../models');

/**
 * Audit Middleware
 * Logs all data modifications (CREATE, UPDATE, DELETE) to database
 * Tracks: action, resource, who did it, when, changes, IP, user agent
 * 
 * Usage: router.post('/resource', auditMiddleware('CREATE', 'ResourceType'), controller)
 */
const auditMiddleware = (action, resourceType) => {
  return async (req, res, next) => {
    const start = Date.now();
    
    // Capture original request data for comparison
    const originalBody = JSON.parse(JSON.stringify(req.body || {}));
    
    // Capture original response.json to intercept response data
    const originalJson = res.json.bind(res);
    let responseData = null;
    
    res.json = function(data) {
      responseData = data;
      return originalJson(data);
    };
    
    // Log after response finishes
    res.on('finish', async () => {
      try {
        const duration_ms = Date.now() - start;
        const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
        
        if (!resourceType) {
          // Log to console only if no resource type specified
          logger.info({
            action,
            tenant: req.tenant?.slug || null,
            user_id: req.user?.id || null,
            role: req.membership?.role || null,
            status: res.statusCode,
            method: req.method,
            path: req.originalUrl,
            duration_ms,
            ip: req.ip,
          }, 'audit');
          return;
        }
        
        // Prepare audit log entry
        const auditEntry = {
          tenant_id: req.tenant?.id || null,
          user_id: req.user?.id || null,
          action: action.toUpperCase(),
          resource_type: resourceType,
          resource_id: responseData?.id || req.params?.id || null,
          ip_address: req.ip,
          user_agent: req.get('user-agent'),
          status: isSuccess ? 'success' : 'failure'
        };
        
        // For CREATE: new_values = request body
        if (action.toUpperCase() === 'CREATE') {
          auditEntry.new_values = originalBody;
        }
        
        // For UPDATE: track old vs new
        if (action.toUpperCase() === 'UPDATE') {
          auditEntry.new_values = originalBody;
          auditEntry.old_values = req.previousData || null;
          
          // Calculate what changed
          if (auditEntry.old_values) {
            const changes = {};
            Object.keys(originalBody).forEach(key => {
              if (originalBody[key] !== auditEntry.old_values[key]) {
                changes[key] = {
                  old: auditEntry.old_values[key],
                  new: originalBody[key]
                };
              }
            });
            auditEntry.changes = Object.keys(changes).length > 0 ? changes : null;
          }
        }
        
        // For DELETE: no values to log, just the ID
        if (action.toUpperCase() === 'DELETE') {
          auditEntry.old_values = req.previousData || null;
        }
        
        // Add failure reason
        if (!isSuccess) {
          auditEntry.reason = responseData?.message || responseData?.error || `HTTP ${res.statusCode}`;
        }
        
        // Persist to database
        await AuditLog.create(auditEntry);
        
        // Also log to application logger
        logger.info({
          ...auditEntry,
          duration_ms,
          method: req.method,
          path: req.originalUrl
        }, 'audit');
        
      } catch (error) {
        logger.error({
          error: error.message,
          stack: error.stack,
          action,
          resourceType,
          status: res.statusCode
        }, 'audit_error');
      }
    });
    
    next();
  };
};

module.exports = auditMiddleware;
