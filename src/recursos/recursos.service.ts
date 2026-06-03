import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
// import { fileLog } from '../../../utils/logger';

@Injectable()
export class RecursosService {
  
  async obtenerDatosDeAPI() {
    // === SIMULACIÓN DE API EXTERNA EN MODO TEST ===
    try {
      // // fileLog({ level: 'INFO', message: 'Simulando petición a API externa (Modo Local Mock)...' });
      
      // Apuntamos a la carpeta raíz donde guardaste tu JSON
      const mockPath = path.resolve(__dirname, '../../utils/stv-mock.json');
      const dataRaw = fs.readFileSync(mockPath, 'utf-8');
      
      // Devolvemos los datos simulados exactamente igual que si vinieran de internet
      return JSON.parse(dataRaw);
      
    } catch (error) {
      // // fileLog({ level: 'ERROR', message: `Error al leer el simulador de API: ${error.message}` });
      return []; // Retorno seguro en caso de fallo
    }
    // ==============================================
  }
}
