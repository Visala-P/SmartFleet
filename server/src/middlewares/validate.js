const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message);
    return res.status(400).json({ message: "Validation failed", issues });
  }

  req.validated = parsed.data;
  return next();
};

module.exports = validate;
