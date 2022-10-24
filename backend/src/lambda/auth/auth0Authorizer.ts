import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'

import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
// const jwksUrl = 'https://dev-g7sxmw0s.us.auth0.com/.well-known/jwks.json'

const secretId = process.env.AUTH_0_SECRET_ID;

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('auth0Authorizer', 'User not authorized', JSON.stringify({ error: e.message }))

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)

  // return verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
  return verify(token, secretId) as JwtPayload
}


function getToken(authHeader: string): string {
  if (!authHeader){ 
  logger.error('getToken', JSON.stringify({ input: authHeader, output: 'No authentication header'})) 
  throw new Error('No authentication header')
  }

  if (!authHeader.toLowerCase().startsWith('bearer ')){
    logger.error('getToken', JSON.stringify({ input: authHeader, output: 'No authentication header'})) 
    throw new Error('Invalid authentication header')
  }

  const split = authHeader.split(' ')
  const token = split[1]

  logger.info('getToken', JSON.stringify({ input: authHeader, output: token})) 
    
  return token
}
