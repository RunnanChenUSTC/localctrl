import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Received request method:', req.method);

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { username, password } = req.body;

    // 四次查询共用一个连接，发响应前关闭。
    const found = await db.withConnection(async (connection) => {
      const [rows] = await connection.execute<RowDataPacket[]>(
        'SELECT * FROM user WHERE UserName = ? AND Password = ?', [username, password]
      );
      if (rows.length === 0) return null;

      const user = rows[0];
      const experimentGroup = JSON.parse(user.ExperimentGroup);
      const usercontentID = user.CourseID || 0;
      const versionValue = experimentGroup["2024Spring_SocraticVersion"] || 0;

      const [promptRows] = await connection.execute<RowDataPacket[]>(
        'SELECT Prompts FROM prompt WHERE PromptID = ?', [versionValue + 1]
      );
      const [authRows] = await connection.execute<RowDataPacket[]>(
        'SELECT Auth_Code FROM GptAuth WHERE Auth_ID = 1'
      );
      const [courseRows] = await connection.execute<RowDataPacket[]>(
        'SELECT CourseContent FROM course WHERE CourseID = ?', [usercontentID]
      );

      return {
        user,
        experimentGroup,
        versionValue,
        userprompt: promptRows.length > 0 ? promptRows[0].Prompts : null,
        authValue: authRows.length > 0 ? authRows[0].Auth_Code : null,
        courseprofile: courseRows.length > 0 ? courseRows[0].CourseContent : null,
      };
    });

    if (!found) {
      return res.status(401).json({ success: false, message: 'Authentication failed' });
    }

    const { user, experimentGroup, versionValue, userprompt, authValue, courseprofile } = found;

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
        password: user.Password,
        experimentGroup: experimentGroup,
        gptAuth: authValue,
        profile: user.Profile,
        prompt: userprompt,
        course: courseprofile
      },
      secretKey,
      { expiresIn: '24h' }
    );

    res.status(200).json({ success: true, token, redirect: redirectUrl, CID: CID });
  } catch (error) {
    console.error('Database connection or query failed:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
