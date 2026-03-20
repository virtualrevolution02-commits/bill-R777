import { Express } from "express";
import { createServer, type Server } from "node:http";
import * as path from "path";
import { storage } from "./storage";
import { insertBillSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Parts Catalog
  app.get("/api/parts", async (_req, res) => {
    try {
      const parts = await storage.getParts();
      res.json(parts);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch parts" });
    }
  });

  // Billing Persistence
  app.post("/api/bills", async (req, res) => {
    try {
      const billData = insertBillSchema.parse(req.body);
      const bill = await storage.createBill(billData);
      res.json(bill);
    } catch (err) {
      if (err instanceof Error) {
        res.status(400).json({ message: err.message });
      } else {
        res.status(500).json({ message: "Failed to create bill" });
      }
    }
  });

  app.get("/api/bills", async (_req, res) => {
    try {
      const bills = await storage.getBills();
      res.json(bills);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch bills" });
    }
  });

  // Serve a simple privacy policy page
  app.get("/privacy-policy", (_req, res) => {
    const filePath = path.resolve(process.cwd(), "server", "templates", "privacy-policy.html");
    res.sendFile(filePath);
  });

  const httpServer = createServer(app);
  return httpServer;
}
