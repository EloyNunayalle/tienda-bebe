import axios, {
	AxiosRequestConfig,
	AxiosResponse,
	RawAxiosRequestHeaders,
} from "axios";

export default class Api {
	private _basePath: string;
	private _authorization: string | null;

	constructor(basePath: string, authorization: string | null = null) {
		this._basePath = basePath;
		this._authorization = authorization;
	}

	public set authorization(value: string) {
		this._authorization = value;
	}

	public async request<RequestType, ResponseType>(config: AxiosRequestConfig) {
		const headers: RawAxiosRequestHeaders = {
			"Content-Type": "application/json",
			Authorization: this._authorization || "", // ⚠️ sin "Bearer"
		};

		const path = this._basePath + config.url;

		const configOptions: AxiosRequestConfig = {
			...config,
			baseURL: this._basePath,
			headers: headers,
		};

		return axios<RequestType, AxiosResponse<ResponseType>>(path, configOptions);
	}

	public get<RequestType, ResponseType>(config: AxiosRequestConfig) {
		return this.request<RequestType, ResponseType>({
			...config,
			method: "GET",
		});
	}

	public post<RequestBodyType, ResponseBodyType>(
		data: RequestBodyType,
		options: AxiosRequestConfig
	) {
		return this.request<RequestBodyType, ResponseBodyType>({
			...options,
			method: "POST",
			data,
		});
	}

	public delete<ResponseBodyType>(options: AxiosRequestConfig) {
		return this.request<void, ResponseBodyType>({
			...options,
			method: "DELETE",
		});
	}

	public put<RequestBodyType, ResponseBodyType>(
		data: RequestBodyType,
		options: AxiosRequestConfig
	) {
		return this.request<RequestBodyType, ResponseBodyType>({
			...options,
			method: "PUT",
			data,
		});
	}

	public patch<RequestBodyType, ResponseBodyType>(
		data: RequestBodyType,
		options: AxiosRequestConfig
	) {
		return this.request<RequestBodyType, ResponseBodyType>({
			...options,
			method: "PATCH",
			data,
		});
	}
}
