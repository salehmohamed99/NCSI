const Domain = require("../models/domainModel");

exports.index = async (req, res) => {
  try {
    const domains = await Domain.find({isEnabled: true});
    res.status(200).json(domains);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.store = async (req, res) => {
  try {
    const { name, url } = req.body;
    const newDomain = new Domain({ name, url });
    await newDomain.save();
    res.status(201).json(newDomain);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.enable = async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ error: "Domain not found" });
    }
    if (domain.isEnabled) {
      return res.status(400).json({ error: "Domain is already enabled" });
    }

    domain.isEnabled = true;
    await domain.save();
    res.status(200).json({ message: "Domain enabled successfully", domain });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.disable = async (req, res) => {
  try {
    const domain = await Domain.findById(req.params.id);
    if (!domain) {
      return res.status(404).json({ error: "Domain not found" });
    }
    if (!domain.isEnabled) {
      return res.status(400).json({ error: "Domain is already disabled" });
    }

    domain.isEnabled = false;
    await domain.save();
    res.status(200).json({ message: "Domain enabled successfully", domain });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
