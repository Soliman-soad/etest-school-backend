import { Request, Response } from "express";
import PDFDocument from "pdfkit";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import Result from "../models/Result";
import User from "../models/User";
import nodemailer from "nodemailer";


export const getUserCertification = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    
    
    const results = await Result.find({ user: userId }).sort({ step: -1 });
    
    if (!results || results.length === 0) {
      return res.status(404).json({ message: "No certification found" });
    }
    
    
    let highestLevel = "";
    const levelOrder = [null, "A1", "A2", "B1", "B2", "C1", "C2"];
    
    for (const result of results) {
      const currentLevel = result.awardedLevel;
      if (currentLevel && levelOrder.indexOf(currentLevel) > levelOrder.indexOf(highestLevel)) {
        highestLevel = currentLevel;
      }
    }
    
    if (!highestLevel) {
      return res.status(404).json({ message: "No certification level achieved" });
    }
    
    res.json({ level: highestLevel });
  } catch (error) {
    console.error("Error getting certification:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const generateCertificate = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { sendEmail } = req.body;
    
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    
    const results = await Result.find({ user: userId }).sort({ step: -1 });
    if (!results || results.length === 0) {
      return res.status(404).json({ message: "No certification found" });
    }
    
    
    let highestLevel = "";
    const levelOrder = [null, "A1", "A2", "B1", "B2", "C1", "C2"];
    
    for (const result of results) {
      const currentLevel = result.awardedLevel;
      if (currentLevel && levelOrder.indexOf(currentLevel) > levelOrder.indexOf(highestLevel)) {
        highestLevel = currentLevel;
      }
    }
    
    if (!highestLevel) {
      return res.status(404).json({ message: "No certification level achieved" });
    }
    
    
    const doc = new PDFDocument({ size: "A4" });
    const certificateId = uuidv4();
    const filename = `certificate-${userId}-${highestLevel}-${Date.now()}.pdf`;
    const filepath = path.join(__dirname, "../../tmp", filename);

    
    fs.mkdirSync(path.dirname(filepath), { recursive: true });

    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    
    doc.fontSize(26).text("Digital Competency Certification", { align: "center" });
    doc.moveDown();
    doc.fontSize(20).text(`This certifies that`, { align: "center" });
    doc.moveDown();
    doc.fontSize(24).text(`${user.name}`, { align: "center" });
    doc.moveDown();
    doc.fontSize(20).text(`has achieved`, { align: "center" });
    doc.moveDown();
    doc.fontSize(28).text(`Level ${highestLevel}`, { align: "center" });
    doc.moveDown();
    doc.fontSize(18).text(`in Digital Competency Assessment`, { align: "center" });
    doc.moveDown(2);
    doc.fontSize(14).text(`Date: ${new Date().toLocaleDateString()}`, { align: "center" });
    doc.moveDown();
    doc.text(`Certificate ID: ${certificateId}`, { align: "center" });

    doc.end();

    
    if (sendEmail && user.email) {
      stream.on("finish", async () => {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });
          
          await transporter.sendMail({
            from: process.env.FROM_EMAIL,
            to: user.email,
            subject: `Your Digital Competency Certificate - Level ${highestLevel}`,
            text: `Congratulations on achieving Level ${highestLevel} in Digital Competency Assessment!`,
            attachments: [
              {
                filename,
                path: filepath,
                contentType: 'application/pdf',
              },
            ],
          });
          
          res.json({ 
            message: "Certificate generated and sent to your email",
            level: highestLevel,
            certificateId
          });
          
          
          setTimeout(() => fs.unlink(filepath, () => {}), 1000 * 60);
        } catch (error) {
          console.error("Error sending certificate email:", error);
          
          res.download(filepath, filename, (err) => {
            if (err) console.error(err);
            setTimeout(() => fs.unlink(filepath, () => {}), 1000 * 60);
          });
        }
      });
    } else {
      
      stream.on("finish", () => {
        res.download(filepath, filename, (err) => {
          if (err) console.error(err);
          
          setTimeout(() => fs.unlink(filepath, () => {}), 1000 * 60);
        });
      });
    }
  } catch (error) {
    console.error("Error generating certificate:", error);
    res.status(500).json({ message: "Server error" });
  }
};