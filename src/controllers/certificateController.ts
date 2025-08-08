import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

export const generateCertificate = async (req: Request, res: Response) => {
  const { userId, level } = req.body;
  if (!userId || !level) return res.status(400).json({ message: "userId and level required" });

  // Create a simple PDF and return as buffer (for demo). In production: store in S3 and save record.
  const doc = new PDFDocument({ size: "A4" });
  const filename = `certificate-${userId}-${Date.now()}.pdf`;
  const filepath = path.join(__dirname, "../../tmp", filename);

  // ensure tmp dir
  fs.mkdirSync(path.dirname(filepath), { recursive: true });

  const stream = fs.createWriteStream(filepath);
  doc.pipe(stream);

  doc.fontSize(26).text("Test School Certification", { align: "center" });
  doc.moveDown();
  doc.fontSize(20).text(`User ID: ${userId}`, { align: "center" });
  doc.moveDown();
  doc.fontSize(18).text(`Certified Level: ${level}`, { align: "center" });
  doc.moveDown();
  doc.fontSize(14).text(`Date: ${new Date().toLocaleDateString()}`, { align: "center" });
  doc.moveDown();
  doc.text(`Certificate ID: ${uuidv4()}`, { align: "center" });

  doc.end();

  stream.on("finish", () => {
    res.download(filepath, filename, (err) => {
      if (err) console.error(err);
      // optional: remove file after sending
      setTimeout(() => fs.unlink(filepath, () => {}), 1000 * 60);
    });
  });
};