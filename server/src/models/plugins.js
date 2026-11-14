/**
 * Apply standard JSON serialization and timestamps transform to a Mongoose schema.
 * Converts `_id` to string `id` and strips `_id`, `__v`, and `passwordHash`.
 * @param {import('mongoose').Schema} schema
 */
export function applyBaseTransform(schema) {
  const transform = (_doc, ret) => {
    if (ret._id !== undefined) {
      ret.id = String(ret._id);
      delete ret._id;
    }
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  };

  schema.set('toJSON', { virtuals: true, transform });
  schema.set('toObject', { virtuals: true, transform });
}
