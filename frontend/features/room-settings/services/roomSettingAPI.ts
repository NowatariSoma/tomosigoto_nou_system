const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_V1_PREFIX = '/api/v1';


export const roomSettingAPI = {

  async getMeasurementFiles(folderName: string): Promise<MeasurementFilesResponse> {
    const response = await fetch(`${API_BASE_URL}${API_V1_PREFIX}/simulation/measurements/${encodeURIComponent(folderName)}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch measurement files: ${response.statusText}`);
    }
    return response.json();
  },

  async analyzeLocalDisplacement(params: LocalDisplacementRequest): Promise<LocalDisplacementResponse> {
    const response = await fetch(`${API_BASE_URL}${API_V1_PREFIX}/simulation/local-displacement`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        folder_name: params.folder_name,
        ameasure_file: params.ameasure_file,
        distance_from_face: params.distance_from_face,
        daily_advance: params.daily_advance,
        max_distance_from_face: params.max_distance_from_face || 200.0,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to analyze displacement: ${error}`);
    }

    return response.json();
  },

  async getChartImage(path: string): Promise<string> {
    // Convert the server path to a URL that can be used to fetch the image
    const filename = path.split('/').pop();
    return `${API_BASE_URL}/static/${filename}`;
  }
};