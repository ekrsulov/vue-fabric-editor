/*
 * @Author: 秦少卫
 * @Date: 2023-08-04 21:13:16
 * @LastEditors: 秦少卫
 * @LastEditTime: 2024-05-11 14:20:26
 * @Description: 素材插件
 */

import { fabric } from 'fabric';
import axios from 'axios';
import qs from 'qs';
import type { IEditor, IPluginTempl } from '@kuaitu/core';

type IPlugin = Pick<
  MaterialPlugin,
  'getTemplTypeList' | 'getTemplList' | 'getMaterialTypeList' | 'getMaterialList' | 'getSizeList'
>;

declare module '@kuaitu/core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface IEditor extends IPlugin {}
}

class MaterialPlugin implements IPluginTempl {
  static pluginName = 'MaterialPlugin';
  static apis = [
    'getTemplTypeList',
    'getTemplList',
    'getMaterialTypeList',
    'getMaterialList',
    'getSizeList',
  ];
  apiMapUrl: { [propName: string]: string };
  repoSrc: string;
  constructor(public canvas: fabric.Canvas, public editor: IEditor, config: { repoSrc: string }) {
    this.repoSrc = config.repoSrc;
    this.apiMapUrl = {
      template: config.repoSrc + '/template/type.json',
      svg: config.repoSrc + '/svg/type.json',
    };
  }
  // 获取模板分类
  getTemplTypeList() {
    return axios.get(`${this.repoSrc}/api/templ-types?pagination[pageSize]=100`).then((res) => {
      const list = res.data.data.map((item: any) => {
        return {
          value: item.id,
          label: item.attributes.name,
        };
      });
      return list;
    });
  }
  // 分页获取模板列表
  getTemplList(templType = '', index = 1, searchKeyword = '') {
    const query = {
      fields: '*',
      populate: {
        img: '*',
      },
      filters: {},
      pagination: {
        page: index,
        pageSize: 10,
      },
    };

    const queryParams = this._getQueryParams(query, [
      {
        key: 'templ_type',
        value: templType,
        type: '$eq',
      },
      {
        key: 'name',
        value: searchKeyword,
        type: '$contains',
      },
    ]);

    return axios.get(`${this.repoSrc}/api/templs?${queryParams}`).then((res: any) => {
      const list = res.data.data.map((item: any) => {
        return {
          name: item.attributes.name,
          desc: item.attributes.desc,
          src: this._getMaterialPreviewUrl(item.attributes.img),
          json: item.attributes.json,
        };
      });
      return { list, pagination: res?.data?.meta?.pagination };
    });
  }

  /**
   * @description: 获取素材分类
   * @return {Promise<any>}
   */
  getMaterialTypeList() {
    return axios.get(`${this.repoSrc}/api/material-types?pagination[pageSize]=100`).then((res) => {
      const list = res.data.data.map((item: any) => {
        return {
          value: item.id,
          label: item.attributes.name,
        };
      });
      return list;
    });
  }

  /**
   * @description: 获取素材列表
   * @returns Promise<Array>
   */
  getMaterialList(materialType = '', index = 1, searchKeyword = '') {
    const query = {
      populate: {
        img: '*',
      },
      // fields: ['materialType'],
      filters: {},
      pagination: {
        page: index,
        pageSize: 50,
      },
    };

    const queryParams = this._getQueryParams(query, [
      {
        key: 'material_type',
        value: materialType,
        type: '$eq',
      },
      {
        key: 'name',
        value: searchKeyword,
        type: '$contains',
      },
    ]);

    return axios.get(`${this.repoSrc}/api/materials?${queryParams}`).then((res: any) => {
      const list = res.data.data.map((item: any) => {
        return {
          name: item.attributes.name,
          desc: item.attributes.desc,
          src: this._getMaterialInfoUrl(item.attributes.img),
          previewSrc: this._getMaterialPreviewUrl(item.attributes.img),
        };
      });
      return { list, pagination: res?.data?.meta?.pagination };
    });
  }

  getSizeList() {
    return axios.get(`${this.repoSrc}/api/sizes?pagination[pageSize]=100`).then((res) => {
      const list = res.data.data.map((item: any) => {
        return {
          value: item.id,
          name: item.attributes.name,
          width: Number(item.attributes.width),
          height: Number(item.attributes.height),
          unit: item.attributes.unit,
        };
      });
      return list;
    }).catch((error) => {
      console.warn('Failed to fetch system sizes from API, using fallback data:', error);
      // Fallback data based on provided JSON structure
      const fallbackData = {
        "data": [
          {
            "id": 1,
            "attributes": {
              "name": "正方形",
              "width": "1000",
              "height": "1000",
              "unit": "px",
              "createdAt": "2025-06-16T10:01:06.690Z",
              "updatedAt": "2025-06-16T10:01:08.920Z",
              "publishedAt": "2025-06-16T10:01:08.918Z"
            }
          },
          {
            "id": 2,
            "attributes": {
              "name": "小红书配图",
              "width": "1242",
              "height": "1660",
              "unit": "px",
              "createdAt": "2025-06-16T10:30:18.297Z",
              "updatedAt": "2025-06-16T10:30:19.809Z",
              "publishedAt": "2025-06-16T10:30:19.807Z"
            }
          },
          {
            "id": 3,
            "attributes": {
              "name": "公众号首图",
              "width": "900",
              "height": "383",
              "unit": "px",
              "createdAt": "2025-06-16T10:30:36.026Z",
              "updatedAt": "2025-06-16T10:30:38.317Z",
              "publishedAt": "2025-06-16T10:30:38.314Z"
            }
          },
          {
            "id": 4,
            "attributes": {
              "name": "公众号次图",
              "width": "500",
              "height": "500",
              "unit": "px",
              "createdAt": "2025-06-16T10:30:49.251Z",
              "updatedAt": "2025-06-16T10:32:34.719Z",
              "publishedAt": "2025-06-16T10:32:34.717Z"
            }
          },
          {
            "id": 5,
            "attributes": {
              "name": "竖版直播背景",
              "width": "1242",
              "height": "1660",
              "unit": "px",
              "createdAt": "2025-06-16T10:31:03.683Z",
              "updatedAt": "2025-06-16T10:32:35.847Z",
              "publishedAt": "2025-06-16T10:32:35.844Z"
            }
          },
          {
            "id": 6,
            "attributes": {
              "name": "竖版视频封面",
              "width": "1242",
              "height": "2208",
              "unit": "px",
              "createdAt": "2025-06-16T10:31:19.077Z",
              "updatedAt": "2025-06-16T10:32:36.947Z",
              "publishedAt": "2025-06-16T10:32:36.944Z"
            }
          },
          {
            "id": 7,
            "attributes": {
              "name": "横版视频封面",
              "width": "1920",
              "height": "1080",
              "unit": "px",
              "createdAt": "2025-06-16T10:31:32.578Z",
              "updatedAt": "2025-06-16T10:32:38.009Z",
              "publishedAt": "2025-06-16T10:32:38.007Z"
            }
          },
          {
            "id": 8,
            "attributes": {
              "name": "商品主图",
              "width": "800",
              "height": "800",
              "unit": "px",
              "createdAt": "2025-06-16T10:31:45.525Z",
              "updatedAt": "2025-06-16T10:32:39.386Z",
              "publishedAt": "2025-06-16T10:32:39.383Z"
            }
          },
          {
            "id": 9,
            "attributes": {
              "name": "电商详情页面",
              "width": "750",
              "height": "1000",
              "unit": "px",
              "createdAt": "2025-06-16T10:31:59.855Z",
              "updatedAt": "2025-06-16T10:32:40.741Z",
              "publishedAt": "2025-06-16T10:32:40.738Z"
            }
          },
          {
            "id": 10,
            "attributes": {
              "name": "A4",
              "width": "595",
              "height": "842",
              "unit": "px",
              "createdAt": "2025-06-16T10:32:16.305Z",
              "updatedAt": "2025-06-16T10:32:42.210Z",
              "publishedAt": "2025-06-16T10:32:42.194Z"
            }
          },
          {
            "id": 11,
            "attributes": {
              "name": "A4横版",
              "width": "842",
              "height": "595",
              "unit": "px",
              "createdAt": "2025-06-16T10:32:32.454Z",
              "updatedAt": "2025-06-16T10:32:43.324Z",
              "publishedAt": "2025-06-16T10:32:43.322Z"
            }
          }
        ],
        "meta": {
          "pagination": {
            "page": 1,
            "pageSize": 100,
            "pageCount": 1,
            "total": 11
          }
        }
      };
      
      // Transform fallback data to expected format
      const list = fallbackData.data.map((item: any) => {
        return {
          value: item.id,
          name: item.attributes.name,
          width: Number(item.attributes.width),
          height: Number(item.attributes.height),
          unit: item.attributes.unit,
        };
      });
      return list;
    });
  }
  getFontList() {
    return axios.get(`${this.repoSrc}/api/fonts?pagination[pageSize]=100`).then((res) => {
      const list = res.data.data.map((item: any) => {
        return {
          value: item.id,
          label: item.attributes.name,
        };
      });
      return list;
    });
  }

  _getMaterialInfoUrl(info: any) {
    const imgUrl = info?.data?.attributes?.url || '';
    return this.repoSrc + imgUrl;
  }

  _getMaterialPreviewUrl(info: any) {
    const imgUrl = info?.data?.attributes?.formats?.small?.url || info?.data?.attributes?.url || '';
    return this.repoSrc + imgUrl;
  }

  // 拼接查询条件参数
  _getQueryParams(option: any, filters: any) {
    filters.forEach((item: any) => {
      const { key, value, type } = item;
      if (value) {
        option.filters[key] = { [type]: value };
      }
    });
    return qs.stringify(option);
  }

  async getMaterialInfo(typeId: string) {
    const url = this.apiMapUrl[typeId];
    const res = await axios.get(url, { params: { typeId } });
    return res.data.data;
  }
}

export default MaterialPlugin;
