import {AxiosResponse} from "axios";

export class ApiResponseError extends Error {
  public static fromResponse(response: AxiosResponse<any>): ApiResponseError {

    return new ApiResponseError(
      response.status,
      `Response ${response.status}`,
      response.data
    )
  }

  public readonly statusCode: number;
  public readonly responseData: any;

  constructor(statusCode: number, message: string, responseData: any) {
    super(message);
    this.statusCode = statusCode;
    this.responseData = responseData;
  }

}
