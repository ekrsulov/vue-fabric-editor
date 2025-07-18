<!--
 * @Author: 秦少卫
 * @Date: 2024-09-11 17:07:42
 * @LastEditors: 秦少卫
 * @LastEditTime: 2025-02-20 14:10:05
 * @Description: file content
-->

[English](https://github.com/ikuaitu/vue-fabric-editor/blob/main/README-en.md) | [中文](https://github.com/ikuaitu/vue-fabric-editor/blob/main/README-cn.md) | Español

<p align="center">
  <a href="https://pro.kuaitu.cc" target="_blank">
    <img src="https://github.com/user-attachments/assets/4e519179-8d19-41cc-ad2b-a1d7ebc63836" width="318px" alt="Editor de imágenes de código abierto" />
  </a>
</p>

<h3 align="center">Editor de Imágenes de Código Abierto · Arquitectura de Plugins · Diseño Drag & Drop · Funcionalidades Completas </h3>
<p align="center">Editor de imágenes basado en plugins desarrollado con fabric.js y Vue, con fuentes personalizables, materiales, plantillas de diseño, menús contextuales y atajos de teclado</p>

<p align="center"><a href="https://ikuaitu.github.io/vue-fabric-editor/" target="_blank">Demo</a> · <a href="https://ikuaitu.github.io/doc/#/"  target="_blank">Documentación</a> · <a href="https://www.kuaitu.cc/"  target="_blank">Demo Versión Comercial</a> · <a href="https://pro.kuaitu.cc/"  target="_blank">Introducción Versión Comercial</a>
· <a href="https://new.kuaitu.cc/#/store"  target="_blank">Diseñador DIY de Productos</a> · <a href="https://ws0gdejldw.feishu.cn/docx/P8ZGdHQ9OoGxcaxyFYecXwO9nig?from=from_copylink"  target="_blank">Introducción Productos DIY</a></p>
<br />

<p align="center">
  <a href="" target="_blank">
    <img src="https://img.shields.io/github/stars/ikuaitu/vue-fabric-editor?style=flat" alt="stars" />
  </a>
	
  <a href="" target="_blank">
    <img src="https://img.shields.io/github/forks/ikuaitu/vue-fabric-editor?style=flat" alt="forks" />
  </a>
	
  <a href="https://github.com/ikuaitu/vue-fabric-editor/graphs/contributors" target="_blank">
    <img src="https://img.shields.io/github/contributors/ikuaitu/vue-fabric-editor" alt="contributors" />
  </a>
  <a href="https://github.com/ikuaitu/vue-fabric-editor?tab=MIT-1-ov-file" target="_blank">
    <img src="https://img.shields.io/github/license/ikuaitu/vue-fabric-editor?style=flat" alt="license" />
  </a>
  <a href="https://www.kuaitu.cc/" target="_blank">
    <img src="https://img.shields.io/website?url=http%3A%2F%2Fpro.kuaitu.cc%2F" alt="Sitio web de Kuaitu Design" />
  </a>
</p>

<br>
<p align="center">
  <a href="" >
    <img src="https://github.com/user-attachments/assets/2a41f5ac-2211-45b8-b683-ffbdf72e6d8b" alt="demo" />
  </a>
</p>

## Introducción

Kuaitu Design, vue-fabric-editor es un editor de imágenes basado en fabric.js y Vue, con fuentes personalizables, materiales, plantillas de diseño, menús contextuales y atajos de teclado.

[Introducción con GIF](https://juejin.cn/post/7222141882515128375) · [Video de introducción](https://www.bilibili.com/video/BV1US421A7TU/?spm_id_from=333.999.0.0)

### Características

1. **Arquitectura de Plugins**: Extensible a través de plugins, con soporte para menús contextuales y atajos de teclado.
2. **Diseño Drag & Drop**: Un editor gráfico ligero y simple, no una herramienta de diseño pesada como Photoshop online.
3. **Funcionalidades Completas**: Análisis de PSD, líneas guía, historial, gradientes, fuentes personalizadas, recorte y otras funcionalidades.

### Funcionalidades Existentes

- Importar archivos JSON y PSD
- Exportar archivos PNG, SVG y JSON
- Agrupar/desagrupar elementos
- Funcionalidad de capas
- Propiedades de gradientes
- Propiedades de apariencia/fuente/contorno/sombra
- Deshacer/rehacer
- Atajos de teclado
- Menú contextual
- Líneas guía
- Reglas
- Fuentes personalizadas
- Materiales y plantillas personalizadas
- Insertar SVG y materiales de imagen
- Alineación horizontal y vertical de múltiples elementos
- Configuración de propiedades de fondo
- Flechas/líneas
- Pincel/dibujo de polígonos
- Códigos QR/códigos de barras
- Reemplazo/recorte/filtros de imágenes
- Marca de agua
- Internacionalización

## Uso

Instale primero node.js v18-v20 y pnpm 8.4.0, luego ejecute los siguientes comandos:

```shell
// Instalar pnpm
npm install -g pnpm@8.4.0

// Para usuarios en China, usar proxy de Taobao
// npm install -g pnpm@8.4.0 --registry=https://registry.npmmirror.com
pnpm i
pnpm dev
```
Importante: Debe usar pnpm 8.x, versiones superiores de pnpm pueden causar inconsistencias en dependencias y errores en la página.

## Servicios para Desarrolladores

- **Grupo de WeChat**: Hemos creado múltiples grupos de intercambio de WeChat para el proyecto, donde el autor y los mantenedores están activos, respondiendo preguntas regularmente.
- **Tutorial de fabric.js en chino**: [https://blog.kuaitu.cc](https://blog.kuaitu.cc/).
- **Círculo de Conocimiento**: Actualizaciones a largo plazo de materiales relacionados con editores de código abierto y fabric.js, acumulando mejores prácticas, experiencias de desarrollo compartidas, ejemplos de código, etc.
  <img src="https://github.com/nihaojob/vue-fabric-editor/assets/13534626/25e9075e-f751-4110-aadd-30fe453e02d9" width="500px" alt="código QR" />

## Versión de Pago

Ayuda a las empresas a construir rápidamente herramientas de diseño online, **reduciendo la inversión en I+D empresarial y evitando reinventar la rueda.**

[Introducción de funcionalidades](https://ws0gdejldw.feishu.cn/docx/GKmnddCgFokr4sxFeYNcoql1nAb) · [Introducción del producto](http://pro.kuaitu.cc/) · [Demo](https://www.kuaitu.cc/)

La versión de código abierto incluye solo el código frontend, la versión de pago **proporciona frontend y backend completos, panel de administración, funcionalidades completas listas para usar, proporciona autorización de código fuente y soporta desarrollo secundario**.

- **Listo para usar, funcionalidades completas**: Capacidades de diseño ricas, proporciona funcionalidades completas de frontend y backend, se puede usar inmediatamente después del despliegue.
- **Arquitectura de plugins, fácil extensión**: Basado en API de plugins, desarrollo secundario rápido del editor.
- **Generación por lotes, salida rápida**: Soporta generación por lotes de imágenes a través de interfaces HTTP y archivos de hojas de cálculo.
- **Diseño drag & drop, fácil de usar**: Adecuado para usuarios comunes, fácil de usar sin entrenamiento.
- **Adaptación multiplataforma**: Versión PC, versión H5 soporta varios escenarios de aplicación.
- **Integración técnica, documentación y entrenamiento**: Proporciona más soporte, completando eficientemente la integración técnica.
- **Desarrollo personalizado, reducción de inversión**: Soporta completar rápidamente el desarrollo de funcionalidades personalizadas, reduciendo la inversión en I+D.
  <a href="https://pro.kuaitu.cc" target="_blank">
  <img src="https://github.com/user-attachments/assets/5303395b-247d-45be-a411-ef27a389156c" alt="Editor de imágenes de código abierto" />
  </a>
  
## Diseñador DIY de Productos/Ropa

<a href="https://new.kuaitu.cc/#/store"  target="_blank">Diseñador DIY de Productos</a> · <a href="https://ws0gdejldw.feishu.cn/docx/P8ZGdHQ9OoGxcaxyFYecXwO9nig?from=from_copylink"  target="_blank">Introducción Productos DIY</a></p>

![image](https://github.com/user-attachments/assets/c00fcf50-4a71-4d0a-8f3c-78ac45324672)

## Guía de Contribución

El proyecto está dedicado a crear una aplicación de editor de imágenes web lista para usar, mientras acumula una capa de encapsulación entre aplicaciones de editores de imágenes web y fabric.js. Esperamos que la capa de encapsulación esté diseñada para desarrolladores, proporcionando interfaces más simples que permitan a los desarrolladores implementar fácilmente el desarrollo de aplicaciones de imágenes.

Si te interesa esto, te invitamos sinceramente a unirte, crezcamos juntos. Solo necesitas conocimientos básicos de Git y sintaxis de Javascript.

[【Envía código y gana un ratón gamer Razer】](https://github.com/ikuaitu/vue-fabric-editor/issues/526)

### Materiales Relacionados

Estas son mis notas técnicas sobre el editor publicadas en la comunidad Juejin, con más detalles:

1. [Desarrollar rápidamente un editor de imágenes usando fabric.js](https://juejin.cn/post/7155040639497797645)
2. [Implementación detallada del desarrollo de editores de imágenes con fabric.js](https://juejin.cn/post/7199849226745430076)
3. [¿Qué funcionalidades se pueden implementar desarrollando un editor de imágenes con fabric.js? Múltiples imágenes](https://juejin.cn/post/7222141882515128375)
4. [Compartiendo mi proyecto de código abierto y experiencia open source](https://juejin.cn/post/7224765991896121401)
5. [¿Qué funcionalidades puede implementar la librería Canvas fabric.js? Introducción con GIFs](https://juejin.cn/post/7336743827827015731)
6. [Editor de imágenes Vue de código abierto](https://juejin.cn/post/7384258569590636595)
7. [Experiencia compartida de comercialización de proyectos de código abierto personales](https://juejin.cn/post/7400687574967271478)
8. [Arquitectura de plugins del editor de imágenes fabric.js de código abierto](https://juejin.cn/post/7401071861847949339)

Nota: Si encuentras problemas técnicos, esperamos usar issues para discutir, es más abierto y transparente. Información suficiente hará que resolver problemas sea más eficiente. Consulta [Cómo hacer preguntas de manera inteligente](https://github.com/ryanhanwu/How-To-Ask-Questions-The-Smart-Way/blob/main/README-zh_CN.md#%E6%8F%90%E9%97%AE%E7%9A%84%E6%99%BA%E6%85%A7).

## Agradecimientos

- [刘明野](https://github.com/liumingye) autor de la funcionalidad de reglas.
- [palxiao](https://github.com/palxiao/poster-design/tree/main/packages/color-picker) componente de gradientes del editor de diseño.

## Patrocinios Amistosos

<a href="https://github.com/wangyuan389/mall-cook" target="_blank">
    <img src="https://www.sunmao-design.top/sunmao/admin/assets/logo.896aa176.png" width="50px" alt="Editor de imágenes de código abierto" />    
</a>

<a href="https://github.com/rubickCenter/rubick" target="_blank">
    <img src="https://raw.githubusercontent.com/rubickCenter/rubick/refs/heads/master/public/logo.png" width="50px" alt="Editor de imágenes de código abierto" />    
</a>

<a href="https://github.com/leaferjs/leafer-ui" target="_blank">
    <img src="https://github.com/user-attachments/assets/0c6ed3c4-bc2b-49fb-854d-f9ed75a96121" width="50px" alt="Editor de imágenes de código abierto" />    
</a>

## Administradores

<!-- readme: collaborators -start -->

<!-- readme: collaborators -end -->

## Contribuidores

<!-- readme: collaborators,contributors -start -->

<table>
	<tbody>
		<tr>
            <td align="center">
                <a href="https://github.com/nihaojob">
                    <img src="https://avatars.githubusercontent.com/u/13534626?v=4" width="80;" alt="nihaojob"/>
                    <br />
                    <sub><b>nihaojob</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/Qiu-Jun">
                    <img src="https://avatars.githubusercontent.com/u/24954362?v=4" width="80;" alt="Qiu-Jun"/>
                    <br />
                    <sub><b>Qiu-Jun</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/wuchenguang1998">
                    <img src="https://avatars.githubusercontent.com/u/63847336?v=4" width="80;" alt="wuchenguang1998"/>
                    <br />
                    <sub><b>wuchenguang1998</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/AliceLanniste">
                    <img src="https://avatars.githubusercontent.com/u/17617116?v=4" width="80;" alt="AliceLanniste"/>
                    <br />
                    <sub><b>AliceLanniste</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/ylx252">
                    <img src="https://avatars.githubusercontent.com/u/6425957?v=4" width="80;" alt="ylx252"/>
                    <br />
                    <sub><b>ylx252</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/liumingye">
                    <img src="https://avatars.githubusercontent.com/u/8676207?v=4" width="80;" alt="liumingye"/>
                    <br />
                    <sub><b>liumingye</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/momo2019">
                    <img src="https://avatars.githubusercontent.com/u/26078793?v=4" width="80;" alt="momo2019"/>
                    <br />
                    <sub><b>momo2019</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/ByeWord">
                    <img src="https://avatars.githubusercontent.com/u/37115721?v=4" width="80;" alt="ByeWord"/>
                    <br />
                    <sub><b>ByeWord</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/bigFace2019">
                    <img src="https://avatars.githubusercontent.com/u/55651401?v=4" width="80;" alt="bigFace2019"/>
                    <br />
                    <sub><b>bigFace2019</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/wohuweixiya">
                    <img src="https://avatars.githubusercontent.com/u/86701050?v=4" width="80;" alt="wohuweixiya"/>
                    <br />
                    <sub><b>wohuweixiya</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/zjc2233">
                    <img src="https://avatars.githubusercontent.com/u/43945226?v=4" width="80;" alt="zjc2233"/>
                    <br />
                    <sub><b>zjc2233</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/ijry">
                    <img src="https://avatars.githubusercontent.com/u/3102798?v=4" width="80;" alt="ijry"/>
                    <br />
                    <sub><b>ijry</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/makeng">
                    <img src="https://avatars.githubusercontent.com/u/23654388?v=4" width="80;" alt="makeng"/>
                    <br />
                    <sub><b>makeng</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/z09176141">
                    <img src="https://avatars.githubusercontent.com/u/49260613?v=4" width="80;" alt="z09176141"/>
                    <br />
                    <sub><b>z09176141</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/a847244052">
                    <img src="https://avatars.githubusercontent.com/u/28621500?v=4" width="80;" alt="a847244052"/>
                    <br />
                    <sub><b>a847244052</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/briver0825">
                    <img src="https://avatars.githubusercontent.com/u/87807886?v=4" width="80;" alt="briver0825"/>
                    <br />
                    <sub><b>briver0825</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/skyscraperno1">
                    <img src="https://avatars.githubusercontent.com/u/63391543?v=4" width="80;" alt="skyscraperno1"/>
                    <br />
                    <sub><b>skyscraperno1</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/pengzhijian">
                    <img src="https://avatars.githubusercontent.com/u/133614612?v=4" width="80;" alt="pengzhijian"/>
                    <br />
                    <sub><b>pengzhijian</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/JiangShuQ">
                    <img src="https://avatars.githubusercontent.com/u/95730895?v=4" width="80;" alt="JiangShuQ"/>
                    <br />
                    <sub><b>JiangShuQ</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/hudenghui">
                    <img src="https://avatars.githubusercontent.com/u/17875293?v=4" width="80;" alt="hudenghui"/>
                    <br />
                    <sub><b>hudenghui</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/ddshiyu">
                    <img src="https://avatars.githubusercontent.com/u/37503208?v=4" width="80;" alt="ddshiyu"/>
                    <br />
                    <sub><b>ddshiyu</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/yehan68">
                    <img src="https://avatars.githubusercontent.com/u/40497166?v=4" width="80;" alt="yehan68"/>
                    <br />
                    <sub><b>yehan68</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/luke358">
                    <img src="https://avatars.githubusercontent.com/u/48149577?v=4" width="80;" alt="luke358"/>
                    <br />
                    <sub><b>luke358</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/xiaozeo">
                    <img src="https://avatars.githubusercontent.com/u/13568242?v=4" width="80;" alt="xiaozeo"/>
                    <br />
                    <sub><b>xiaozeo</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/x007xyz">
                    <img src="https://avatars.githubusercontent.com/u/13807549?v=4" width="80;" alt="x007xyz"/>
                    <br />
                    <sub><b>x007xyz</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/wozhi-cl">
                    <img src="https://avatars.githubusercontent.com/u/25359239?v=4" width="80;" alt="wozhi-cl"/>
                    <br />
                    <sub><b>wozhi-cl</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/vvbear">
                    <img src="https://avatars.githubusercontent.com/u/32010827?v=4" width="80;" alt="vvbear"/>
                    <br />
                    <sub><b>vvbear</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/slarkerino">
                    <img src="https://avatars.githubusercontent.com/u/7014849?v=4" width="80;" alt="slarkerino"/>
                    <br />
                    <sub><b>slarkerino</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/rolitter">
                    <img src="https://avatars.githubusercontent.com/u/27326998?v=4" width="80;" alt="rolitter"/>
                    <br />
                    <sub><b>rolitter</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/moJiXiang">
                    <img src="https://avatars.githubusercontent.com/u/5847011?v=4" width="80;" alt="moJiXiang"/>
                    <br />
                    <sub><b>moJiXiang</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/macheteHot">
                    <img src="https://avatars.githubusercontent.com/u/26652329?v=4" width="80;" alt="macheteHot"/>
                    <br />
                    <sub><b>macheteHot</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/liuyaojun">
                    <img src="https://avatars.githubusercontent.com/u/25071631?v=4" width="80;" alt="liuyaojun"/>
                    <br />
                    <sub><b>liuyaojun</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/jooyyy">
                    <img src="https://avatars.githubusercontent.com/u/30552622?v=4" width="80;" alt="jooyyy"/>
                    <br />
                    <sub><b>jooyyy</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/guda-art">
                    <img src="https://avatars.githubusercontent.com/u/66010134?v=4" width="80;" alt="guda-art"/>
                    <br />
                    <sub><b>guda-art</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/nanfb">
                    <img src="https://avatars.githubusercontent.com/u/56207464?v=4" width="80;" alt="nanfb"/>
                    <br />
                    <sub><b>nanfb</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/dulltackle">
                    <img src="https://avatars.githubusercontent.com/u/45963660?v=4" width="80;" alt="dulltackle"/>
                    <br />
                    <sub><b>dulltackle</b></sub>
                </a>
            </td>
		</tr>
		<tr>
            <td align="center">
                <a href="https://github.com/Bamzc">
                    <img src="https://avatars.githubusercontent.com/u/10151046?v=4" width="80;" alt="Bamzc"/>
                    <br />
                    <sub><b>Bamzc</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/Yangzongtai">
                    <img src="https://avatars.githubusercontent.com/u/93592008?v=4" width="80;" alt="Yangzongtai"/>
                    <br />
                    <sub><b>Yangzongtai</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/Alicehhhmm">
                    <img src="https://avatars.githubusercontent.com/u/86783773?v=4" width="80;" alt="Alicehhhmm"/>
                    <br />
                    <sub><b>Alicehhhmm</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/fuqianxi">
                    <img src="https://avatars.githubusercontent.com/u/20251751?v=4" width="80;" alt="fuqianxi"/>
                    <br />
                    <sub><b>fuqianxi</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/icleitoncosta">
                    <img src="https://avatars.githubusercontent.com/u/3260480?v=4" width="80;" alt="icleitoncosta"/>
                    <br />
                    <sub><b>icleitoncosta</b></sub>
                </a>
            </td>
            <td align="center">
                <a href="https://github.com/liucity">
                    <img src="https://avatars.githubusercontent.com/u/12006542?v=4" width="80;" alt="liucity"/>
                    <br />
                    <sub><b>liucity</b></sub>
                </a>
            </td>
		</tr>
	<tbody>
</table>
<!-- readme: collaborators,contributors -end -->

## Licencia

Licenciado bajo la [MIT](./LICENSE) License.
