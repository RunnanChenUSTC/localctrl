import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db'; // 假设你把连接池的代码放在 lib/db.ts 中
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Received request method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const connection = await pool.getConnection();
    const { username, password } = req.body;

    try {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM user WHERE UserName = ? AND Password = ?', [username, password]
      );

      if (rows.length > 0) {
        const user = rows[0];
        const experimentGroup = JSON.parse(user.ExperimentGroup);
        const modifiedPassword = user.Password;
        const userProfile = user.Profile;
        const usercontentID = user.CourseID || 0;
        const searchValue = experimentGroup["2024Spring_Socratic"];
        const gptValue = experimentGroup["2024Spring_Gamified"];
        const versionValue = experimentGroup["2024Spring_SocraticVersion"] || 0;

        const [promptRows] = await pool.execute<RowDataPacket[]>(
          'SELECT Prompts FROM prompt WHERE PromptID = ?', [versionValue + 1]
        );
        const userprompt = promptRows.length > 0 ? promptRows[0].Prompts : null;

        const [authRows] = await pool.execute<RowDataPacket[]>(
          'SELECT Auth_Code FROM GptAuth WHERE Auth_ID = 1'
        );
        const authValue = authRows.length > 0 ? authRows[0].Auth_Code : null;

        const [courseRows] = await pool.execute<RowDataPacket[]>(
          'SELECT CourseContent FROM course WHERE CourseID = ?', [usercontentID]
        );
        const courseprofile = courseRows.length > 0 ? courseRows[0].CourseContent : null;

        let CID = '';
        let redirectUrl = '';
        if (versionValue !== 1) {
          if (versionValue === 2) {
            redirectUrl = 'https://socrates-v2-adfasdfasdfasdfdasfdas.smartpal.chat';
          } else if (versionValue === 3) {
            redirectUrl = 'https://socrates-v3-adfasdfasdfasdfdasfdas.smartpal.chat';
          } else if (versionValue === 4) {
            redirectUrl = 'https://socrates-v4-adfammmdfasdmmfdasfdas.smartpal.chat';
          } else {
            redirectUrl = 'https://baseline-adfasdfasdfasdfdasfdas.smartpal.chat';
          }
        } else {
          redirectUrl = "https://socrates-v1-adfasdfasdfamdfdamfdam.smartpal.chat";
        }

        const secretKey = process.env.JWT_SECRET_KEY as string;
        const token = jwt.sign(
          {
            username: user.UserName,
            password: modifiedPassword,
            experimentGroup: experimentGroup,
            gptAuth: authValue,
            profile: userProfile,
            prompt: userprompt,
            course: courseprofile
          },
          secretKey,
          { expiresIn: '24h' }
        );

        res.status(200).json({ success: true, token, redirect: redirectUrl, CID: CID });
      } else {
        res.status(401).json({ success: false, message: 'Authentication failed' });
      }
    } finally {
      connection.release(); // 确保连接在使用后被释放回连接s
    }
  } catch (error) {
    console.error('Database connection or query failed:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
