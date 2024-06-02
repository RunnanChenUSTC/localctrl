// Importing necessary types and functions
// At the top of your file, import jsonwebtoken
import jwt from 'jsonwebtoken';
import Cookies from 'cookies';
import type { NextApiRequest, NextApiResponse } from 'next';
import mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';
import { truncate } from 'fs/promises';

// The API handler function
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Log the request method to the console
  console.log('Received request method:', req.method);
  
  // Check if the request method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Database connection settings
  const connectionConfig = {
    host: 'mysqlserverless.cluster-cautknyafblq.us-east-1.rds.amazonaws.com',
    user: 'admin',
    password: '35nPQH!ut;anvcA',
    database: 'GPT_experiment',
  };

  try {
    // Connect to the database
    const connection = await mysql.createConnection(connectionConfig);
    const { username, password } = req.body;

    // Execute the query
    const [rows] = await connection.execute<RowDataPacket[]>(
          'SELECT * FROM user WHERE UserName = ? AND Password = ?', [username, password]
    );

    // Check if any rows are returned
    if (rows.length > 0) {
      const user = rows[0];
      const experimentGroup = JSON.parse(user.ExperimentGroup); // Parse the JSON-formatted ExperimentGroup
      // const passwordSuffix = experimentGroup["2024Spring_Socratic"] === 1 ? 'scr!' : 'bsl?';
      const modifiedPassword = user.Password;
      const userProfile = user.Profile;
      const usercontentID = user.CourseID||0;
      // Determine the redirect URL based on the "2024Spring Socratic" value
      const searchValue = experimentGroup["2024Spring_Socratic"];
      const gptValue = experimentGroup["2024Spring_Gamified"];
      const versionValue = experimentGroup["2024Spring_SocraticVersion"]||0;
      const connectionConfig1 = {
        host: 'mysqlserverless.cluster-cautknyafblq.us-east-1.rds.amazonaws.com',
        user: 'admin',
        password: '35nPQH!ut;anvcA',
        database: 'GPT_experiment',
      };
      const connection1 = await mysql.createConnection(connectionConfig1);
       // Fetch prompt based on versionValue
      const [promptRows] = await connection1.execute<RowDataPacket[]>(
        'SELECT Prompts FROM prompt WHERE PromptID = ?', [versionValue+1]
      );
      const userprompt = promptRows.length > 0 ? promptRows[0].Prompts : null;
      const [authRows] = await connection1.execute<RowDataPacket[]>(
        'SELECT Auth_Code FROM GptAuth WHERE Auth_ID = 1'
      );
      const authValue = authRows.length > 0 ? authRows[0].Auth_Code : null;
      const [courseRows] = await connection1.execute<RowDataPacket[]>(
        'SELECT CourseContent FROM course WHERE CourseID = ?', [usercontentID]
      );
      const courseprofile = courseRows.length > 0 ? courseRows[0].CourseContent : null;
      let CID = '';
      let redirectUrl = ''; // Default redirect URL
      if(versionValue !== 1){
      if (versionValue === 2) {
        redirectUrl = 'https://socrates-v2-adfasdfasdfasdfdasfdas.smartpal.chat'; // URL for Search == 1
        //  CID = '1';
      } else if (versionValue === 3) {
        redirectUrl = 'https://socrates-v3-adfasdfasdfasdfdasfdas.smartpal.chat'; // URL for Search == 0 and 2024GPT == 1
        // CID = '3';
      } else if(versionValue === 4){
        redirectUrl = 'https://socrates-v4-adfasdfasdfasdfdasfdas.smartpal.chat'; // URL for all other cases
        // CID = '2';
      }else{
        redirectUrl = 'https://baseline-adfasdfasdfasdfdasfdas.smartpal.chat';
      }
    }else{
        redirectUrl = "https://socrates-v1-adfasdfasdfasdfdasfdas.smartpal.chat";
      }
      const secretKey = process.env.JWT_SECRET_KEY as string;  
      // Generate JWT token
      const token = jwt.sign(
        {
        username: user.UserName,
        password: modifiedPassword, // Storing passwords in JWT is not recommended
        experimentGroup: experimentGroup,
        gptAuth: authValue,
        profile: userProfile,
        prompt: userprompt,
        course: courseprofile
        },
        secretKey,  // Secret key
        { expiresIn: '24h' }         // Token expiration
      );
      const cookies = new Cookies(req, res);
      cookies.set('jwtToken', token, {
        httpOnly: false,
        secure: false, 
        sameSite: 'none',
        maxAge: 3600000 
      });
      // Authentication successful, send the redirect URL
      res.status(200).json({ success: true, token, redirect: redirectUrl, CID: CID });
      // res.status(200).send({ message: 'Login successful', token: token });
    } else {
      // Authentication failed
      res.status(401).json({ success: false, message: 'Authentication failed' });
    }
  } catch (error) {
    // Log the error and return a 500 Internal Server Error response
    console.error('Database connection or query failed:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
